/*!
 * 文章图片查看器
 * 针对 IC 博客里「字小、标注密」的架构图 / 版图 / 波形图：
 * 支持滚轮缩放（以鼠标位置为中心）、拖动、双指缩放、双击放大、键盘操作、组图切换。
 * 无依赖，只绑定 .post-content 内的图片。
 */
(function () {
  "use strict";

  var CONTENT_SELECTOR = ".post-content";
  var MIN_RENDER_SIZE = 120; // 过滤掉图标、表情等小图
  var MIN_SCALE = 0.5;
  var MAX_SCALE = 10;

  var overlay = null;
  var stage = null;
  var img = null;
  var counter = null;
  var btnPrev = null;
  var btnNext = null;
  var btnClose = null;
  var linkOriginal = null;

  var gallery = [];
  var index = 0;

  var scale = 1;
  var tx = 0;
  var ty = 0;

  var pointers = new Map();
  var drag = null;
  var pinch = null;

  function svg(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + "</svg>";
  }

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "iv-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "图片查看器");
    overlay.hidden = true;

    overlay.innerHTML =
      '<div class="iv-stage" tabindex="-1">' +
        '<img class="iv-image" alt="">' +
      "</div>" +
      '<div class="iv-toolbar">' +
        '<button type="button" class="iv-btn" data-act="zoom-out" aria-label="缩小">' + svg('<circle cx="11" cy="11" r="7"/><path d="M8 11h6"/><path d="M21 21l-4.3-4.3"/>') + "</button>" +
        '<button type="button" class="iv-btn" data-act="zoom-in" aria-label="放大">' + svg('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6"/><path d="M21 21l-4.3-4.3"/>') + "</button>" +
        '<button type="button" class="iv-btn" data-act="reset" aria-label="还原">' + svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>') + "</button>" +
        '<a class="iv-btn" data-act="original" target="_blank" rel="noopener" aria-label="新标签页打开原图">' + svg('<path d="M14 3h7v7"/><path d="M21 3l-9 9"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>') + "</a>" +
        '<button type="button" class="iv-btn" data-act="close" aria-label="关闭">' + svg('<path d="M6 6l12 12M18 6L6 18"/>') + "</button>" +
      "</div>" +
      '<button type="button" class="iv-nav iv-prev" aria-label="上一张">' + svg('<path d="M15 5l-7 7 7 7"/>') + "</button>" +
      '<button type="button" class="iv-nav iv-next" aria-label="下一张">' + svg('<path d="M9 5l7 7-7 7"/>') + "</button>" +
      '<div class="iv-counter" aria-live="polite"></div>';

    document.body.appendChild(overlay);

    stage = overlay.querySelector(".iv-stage");
    img = overlay.querySelector(".iv-image");
    counter = overlay.querySelector(".iv-counter");
    btnPrev = overlay.querySelector(".iv-prev");
    btnNext = overlay.querySelector(".iv-next");
    btnClose = overlay.querySelector('[data-act="close"]');
    linkOriginal = overlay.querySelector('[data-act="original"]');

    overlay.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "close") close();
      else if (act === "zoom-in") zoomBy(1.35, viewportCenter());
      else if (act === "zoom-out") zoomBy(1 / 1.35, viewportCenter());
      else if (act === "reset") resetZoom();
    });

    overlay.addEventListener("mousedown", function (e) {
      // 点击遮罩空白处关闭（点到图片、按钮时不算）
      if (e.target === overlay || e.target === stage) close();
    });

    btnPrev.addEventListener("click", function (e) { e.stopPropagation(); go(-1); });
    btnNext.addEventListener("click", function (e) { e.stopPropagation(); go(1); });

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    stage.addEventListener("dblclick", onDoubleClick);

    document.addEventListener("keydown", onKeyDown);
  }

  function viewportCenter() {
    var r = stage.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function applyTransform(withTransition) {
    img.style.transition = withTransition ? "transform .18s ease-out" : "none";
    img.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
  }

  function resetZoom(withTransition) {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform(withTransition !== false);
  }

  // 以屏幕上某一点为中心缩放：该点下方的图像内容保持不动
  function zoomAt(nextScale, px, py, withTransition) {
    var clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    if (clamped === scale) return;
    // 当前视觉中心（getBoundingClientRect 已包含 translate/scale）
    var rect = img.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = px - cx;
    var dy = py - cy;
    // 让指针下的图像内容在缩放前后保持同一位置
    tx = tx + dx - (dx / scale) * clamped;
    ty = ty + dy - (dy / scale) * clamped;
    scale = clamped;
    clampPan();
    applyTransform(withTransition !== false);
  }

  function zoomBy(factor, point) {
    zoomAt(scale * factor, point.x, point.y, true);
  }

  function clampPan() {
    // 用未缩放的布局尺寸 × 当前 scale 计算边界。
    // 不能再用 getBoundingClientRect()：它反映的是上一次 transform 的尺寸。
    var w = img.offsetWidth * scale;
    var h = img.offsetHeight * scale;
    var limitX = Math.max(0, (w - stage.clientWidth) / 2) + 80;
    var limitY = Math.max(0, (h - stage.clientHeight) / 2) + 80;
    tx = Math.min(limitX, Math.max(-limitX, tx));
    ty = Math.min(limitY, Math.max(-limitY, ty));
  }

  function onWheel(e) {
    e.preventDefault();
    var factor = Math.exp(-e.deltaY * 0.0015);
    zoomAt(scale * factor, e.clientX, e.clientY, false);
  }

  function onDoubleClick(e) {
    e.preventDefault();
    if (scale > 1.2) resetZoom(true);
    else zoomAt(2.5, e.clientX, e.clientY, true);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
      stage.classList.add("is-grabbing");
    } else if (pointers.size === 2) {
      drag = null;
      var pts = Array.from(pointers.values());
      var rect0 = img.getBoundingClientRect();
      pinch = {
        distance: dist(pts[0], pts[1]),
        scale: scale,
        tx: tx,
        ty: ty,
        center: midpoint(pts[0], pts[1]),
        centerImage: { x: rect0.left + rect0.width / 2, y: rect0.top + rect0.height / 2 }
      };
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch && pointers.size >= 2) {
      var pts = Array.from(pointers.values()).slice(0, 2);
      var d = dist(pts[0], pts[1]);
      var mid = midpoint(pts[0], pts[1]);
      var ratio = d / (pinch.distance || d);
      var next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinch.scale * ratio));
      // 以双指起始中点为锚：该点下方的图像内容跟随手指移动
      var bx = pinch.centerImage.x - pinch.tx;
      var by = pinch.centerImage.y - pinch.ty;
      var qx = (pinch.center.x - pinch.centerImage.x) / pinch.scale;
      var qy = (pinch.center.y - pinch.centerImage.y) / pinch.scale;
      tx = mid.x - bx - qx * next;
      ty = mid.y - by - qy * next;
      scale = next;
      clampPan();
      applyTransform(false);
      return;
    }

    if (drag && pointers.size === 1) {
      tx = drag.tx + (e.clientX - drag.x);
      ty = drag.ty + (e.clientY - drag.y);
      clampPan();
      applyTransform(false);
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* 指针可能已被释放 */ }
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      drag = null;
      stage.classList.remove("is-grabbing");
    } else if (pointers.size === 1) {
      var p = Array.from(pointers.values())[0];
      drag = { x: p.x, y: p.y, tx: tx, ty: ty };
    }
  }

  function onKeyDown(e) {
    if (overlay.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "+" || e.key === "=") zoomBy(1.35, viewportCenter());
    else if (e.key === "-") zoomBy(1 / 1.35, viewportCenter());
    else if (e.key === "0") resetZoom(true);
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function preload(i) {
    var item = gallery[i];
    if (!item) return;
    var pre = new Image();
    pre.src = item.currentSrc || item.src;
  }

  function show(i, direction) {
    if (!gallery.length) return;
    index = (i + gallery.length) % gallery.length;
    var source = gallery[index];
    img.src = source.currentSrc || source.src;
    img.alt = source.alt || "";
    linkOriginal.href = img.src;
    counter.textContent = gallery.length > 1 ? index + 1 + " / " + gallery.length : "";
    var multiple = gallery.length > 1;
    btnPrev.hidden = !multiple;
    btnNext.hidden = !multiple;
    overlay.classList.toggle("is-single", !multiple);
    resetZoom(false);
    preload((index + 1) % gallery.length);
    preload((index - 1 + gallery.length) % gallery.length);
    if (direction) {
      img.classList.remove("iv-in-left", "iv-in-right");
      // 触发重排，让动画重新播放
      void img.offsetWidth;
      img.classList.add(direction > 0 ? "iv-in-right" : "iv-in-left");
    }
  }

  function go(delta) {
    if (gallery.length < 2) return;
    show(index + delta, delta);
  }

  function open(list, startIndex) {
    if (!overlay) buildOverlay();
    gallery = list;
    overlay.hidden = false;
    document.documentElement.classList.add("iv-open");
    show(startIndex || 0, 0);
    btnClose.focus({ preventScroll: true });
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.documentElement.classList.remove("iv-open");
    img.removeAttribute("src");
  }

  function collectImages(root) {
    return Array.prototype.filter.call(root.querySelectorAll("img"), function (el) {
      if (el.closest(".iv-overlay")) return false;
      if (el.hasAttribute("data-nozoom")) return false;
      if (el.classList.contains("emoji")) return false;
      // 尚未加载完时用属性宽高兜底
      var w = el.naturalWidth || parseInt(el.getAttribute("width") || "0", 10);
      var h = el.naturalHeight || parseInt(el.getAttribute("height") || "0", 10);
      return (w >= MIN_RENDER_SIZE && h >= MIN_RENDER_SIZE) || (w === 0 && h === 0);
    });
  }

  function bind() {
    var root = document.querySelector(CONTENT_SELECTOR);
    if (!root) return;

    root.addEventListener("click", function (e) {
      var target = e.target;
      if (!target || target.tagName !== "IMG") return;
      if (target.closest(".iv-overlay")) return;
      if (target.hasAttribute("data-nozoom")) return;

      var images = collectImages(root);
      var i = images.indexOf(target);
      if (i === -1) return;

      // 图片可能被 <a> 包着，先阻止跳转
      e.preventDefault();
      e.stopPropagation();
      open(images, i);
    });

    // 给可放大的图加光标提示
    var observer = new MutationObserver(function () {
      Array.prototype.forEach.call(root.querySelectorAll("img"), function (el) {
        if (el.closest(".iv-overlay")) return;
        el.classList.toggle("iv-zoomable", !el.hasAttribute("data-nozoom"));
      });
    });
    observer.observe(root, { childList: true, subtree: true });
    Array.prototype.forEach.call(root.querySelectorAll("img"), function (el) {
      el.classList.add("iv-zoomable");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
