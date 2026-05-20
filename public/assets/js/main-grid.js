(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const readInlinePosts = () => {
    const source = document.getElementById("main-grid-data");
    if (!source) return [];
    try {
      const parsed = JSON.parse(source.textContent || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const resolveAssetUrl = (path) => {
    const value = String(path || "").trim();
    if (!value) return "";
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) return value;
    if (value.startsWith("/") || value.startsWith("../") || value.startsWith("./")) return value;
    if (value.startsWith("assets/")) {
      const localPath = value.replace(/^assets\//, "");
      return window.picjejuAsset ? window.picjejuAsset(localPath) : `../assets/${localPath}`;
    }
    return window.picjejuAsset ? window.picjejuAsset(value) : value;
  };

  const FALLBACK_POSTS = [
    ["figma-main-banner-big.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>", "lg"],
    ["figma-card-1.png", "축제/이벤트", "모닝 플리 디제잉과 콜드브루와 함께하는 팝업 모닝 클럽"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-1.png", "축제/이벤트", "모닝 플리 디제잉과 콜드브루와 함께하는 팝업 모닝 클럽"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-2.png", "축제/이벤트", "제주도 도시숲 개장 행사\n<숲들이 DAY>"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-2.png", "축제/이벤트", "제주도 도시숲 개장 행사\n<숲들이 DAY>"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-3.png", "픽제주 이벤트", "러닝 초보자 클래스\n<웃으며 달리는 방법>"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-3.png", "픽제주 이벤트", "러닝 초보자 클래스\n<웃으며 달리는 방법>"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-main-banner-big.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>", "square"],
    ["figma-card-1.png", "축제/이벤트", "모닝 플리 디제잉과 콜드브루와 함께하는 팝업 모닝 클럽"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-2.png", "축제/이벤트", "제주도 도시숲 개장 행사\n<숲들이 DAY>"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-1.png", "축제/이벤트", "모닝 플리 디제잉과 콜드브루와 함께하는 팝업 모닝 클럽"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-2.png", "축제/이벤트", "제주도 도시숲 개장 행사\n<숲들이 DAY>"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-3.png", "픽제주 이벤트", "러닝 초보자 클래스\n<웃으며 달리는 방법>"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-3.png", "픽제주 이벤트", "러닝 초보자 클래스\n<웃으며 달리는 방법>"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-main-banner-big.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>", "square"],
    ["figma-card-1.png", "축제/이벤트", "모닝 플리 디제잉과 콜드브루와 함께하는 팝업 모닝 클럽"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-2.png", "축제/이벤트", "제주도 도시숲 개장 행사\n<숲들이 DAY>"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-3.png", "픽제주 이벤트", "러닝 초보자 클래스\n<웃으며 달리는 방법>"],
    ["figma-card-9.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-card-1.png", "축제/이벤트", "모닝 플리 디제잉과 콜드브루와 함께하는 팝업 모닝 클럽"],
    ["figma-card-10.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"],
    ["figma-main-banner-big.png", "전시", "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>", "square"]
  ].map(([file, badge, title, size = ""]) => ({
    thumb: `assets/remote/${file}`,
    badge,
    title,
    size
  }));

  const readPosts = async (grid) => {
    const dataSource = grid?.dataset?.source || "";
    if (dataSource && window.fetch) {
      try {
        const response = await fetch(dataSource, { cache: "no-store" });
        if (response.ok) {
          const parsed = await response.json();
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    const inlinePosts = readInlinePosts();
    return inlinePosts.length ? inlinePosts : FALLBACK_POSTS;
  };

  const resolveDetailUrl = (grid) => {
    const detailPath = grid.dataset.detailPath || "single-view.html";
    return window.picjejuPage ? window.picjejuPage(detailPath) : detailPath;
  };

  const DESKTOP_MASONRY_QUERY = "(min-width: 1024px)";
  const DESKTOP_COLUMNS = 4;
  const DESKTOP_GAP = 16;
  const FIGMA_BASE_WIDTH = 1280;
  const FIGMA_CARD_WIDTH = 308;
  const FIGMA_HERO_HEIGHT = 500;
  const FIGMA_SMALL_HEIGHTS = [390, 430, 390, 430, 390, 430, 390, 430, 390, 430, 390, 430];
  const AOS_DELAY_STEP = 50;
  const AOS_DURATION = 600;
  const AOS_OFFSET = 48;
  const AOS_STAGGER_COUNT = 4;

  let relayoutTimer = 0;
  let aosRefreshFrame = 0;

  const getAosDelay = (index) => (Math.max(index, 0) % AOS_STAGGER_COUNT) * AOS_DELAY_STEP;

  const setCardAnimation = (card, index) => {
    card.dataset.aos = "fade-up";
    card.dataset.aosDuration = String(AOS_DURATION);
    card.dataset.aosDelay = String(getAosDelay(index));
    card.dataset.aosEasing = "ease-out-cubic";
    card.dataset.aosOffset = String(AOS_OFFSET);
    card.dataset.aosOnce = "true";
    card.style.setProperty("--pj-main-aos-delay", `${getAosDelay(index)}ms`);
  };

  const refreshAos = () => {
    if (!window.AOS) return;
    if (aosRefreshFrame) window.cancelAnimationFrame(aosRefreshFrame);
    aosRefreshFrame = window.requestAnimationFrame(() => {
      aosRefreshFrame = window.requestAnimationFrame(() => {
        aosRefreshFrame = 0;
        if (typeof window.AOS.refresh === "function") {
          window.AOS.refresh();
          return;
        }
        if (typeof window.AOS.refreshHard === "function") window.AOS.refreshHard();
      });
    });
  };

  const getCardSize = (card) => {
    if (card.classList.contains("lg")) return "lg";
    if (card.classList.contains("square")) return "square";
    return "";
  };

  const resetDesktopMasonry = (grid) => {
    grid.classList.remove("is-desktop-masonry");
    grid.style.height = "";
    grid.querySelectorAll(".grid-item").forEach((card) => {
      card.style.left = "";
      card.style.top = "";
      card.style.width = "";
      card.style.height = "";
      card.style.position = "";
    });
  };

  const layoutDesktopMasonry = (grid) => {
    if (!grid) return;
    if (!window.matchMedia(DESKTOP_MASONRY_QUERY).matches) {
      resetDesktopMasonry(grid);
      return;
    }

    const cards = Array.from(grid.querySelectorAll(".grid-item"));
    if (!cards.length) return;

    const gridWidth = grid.clientWidth || FIGMA_BASE_WIDTH;
    const columnWidth = Math.round((gridWidth - (DESKTOP_COLUMNS - 1) * DESKTOP_GAP) / DESKTOP_COLUMNS);
    const scale = columnWidth / FIGMA_CARD_WIDTH;
    const gap = DESKTOP_GAP;
    const columns = Array(DESKTOP_COLUMNS).fill(DESKTOP_GAP);
    let smallIndex = 0;

    grid.classList.add("is-desktop-masonry");

    const place = (card, x, y, width, height) => {
      card.style.position = "absolute";
      card.style.left = `${Math.round(x)}px`;
      card.style.top = `${Math.round(y)}px`;
      card.style.width = `${Math.round(width)}px`;
      card.style.height = `${Math.round(height)}px`;
    };

    const getBestColumn = () => {
      let target = 0;
      for (let i = 1; i < columns.length; i += 1) {
        if (columns[i] < columns[target]) target = i;
      }
      return target;
    };

    const getBestPair = () => {
      let target = 0;
      let best = Number.POSITIVE_INFINITY;
      for (let i = 0; i <= columns.length - 2; i += 1) {
        const y = Math.max(columns[i], columns[i + 1]);
        if (y < best) {
          best = y;
          target = i;
        }
      }
      return target;
    };

    cards.forEach((card) => {
      const size = getCardSize(card);

      if (size === "lg") {
        const y = Math.max(...columns);
        const height = Math.round((gridWidth / FIGMA_BASE_WIDTH) * FIGMA_HERO_HEIGHT);
        place(card, 0, y, gridWidth, height);
        columns.fill(y + height + gap);
        return;
      }

      if (size === "square") {
        const start = getBestPair();
        const y = Math.max(columns[start], columns[start + 1]);
        const width = columnWidth * 2 + gap;
        const height = width;
        place(card, start * (columnWidth + gap), y, width, height);
        columns[start] = y + height + gap;
        columns[start + 1] = y + height + gap;
        return;
      }

      const column = getBestColumn();
      const y = columns[column];
      const figmaHeight = FIGMA_SMALL_HEIGHTS[smallIndex % FIGMA_SMALL_HEIGHTS.length];
      const height = Math.round(figmaHeight * scale);
      place(card, column * (columnWidth + gap), y, columnWidth, height);
      columns[column] = y + height + gap;
      smallIndex += 1;
    });

    grid.style.height = `${Math.max(...columns) - gap}px`;
  };

  const scheduleDesktopMasonry = (grid) => {
    window.clearTimeout(relayoutTimer);
    relayoutTimer = window.setTimeout(() => layoutDesktopMasonry(grid), 40);
  };

  const getPostSize = (post) => {
    const rawSize = String(post?.size || "").trim();
    return rawSize === "lg" || rawSize === "square" ? rawSize : "";
  };

  const MOBILE_QUERY = "(max-width: 767px)";
  const MOBILE_CARD_OVERRIDES = [
    {
      thumb: "assets/remote/figma-mobile-card-1.png",
      badge: "전시",
      title: "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"
    },
    {
      thumb: "assets/remote/figma-mobile-card-3.png",
      badge: "전시",
      title: "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"
    },
    {
      thumb: "assets/remote/figma-mobile-card-2.png",
      badge: "전시",
      title: "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"
    },
    {
      thumb: "assets/remote/figma-mobile-card-1.png",
      badge: "전시",
      title: "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"
    },
    {
      thumb: "assets/remote/figma-mobile-card-1.png",
      badge: "전시",
      title: "사진으로 만나는 해녀의 삶\n<섭지 해녀우다!>"
    },
    {
      thumb: "assets/remote/figma-mobile-card-4.png",
      badge: "축제/이벤트",
      title: "붉은 달이 뜬다!\n공포영화 커뮤니티"
    },
    {
      thumb: "assets/remote/figma-mobile-card-3.png",
      badge: "축제/이벤트",
      title: "제주도 도시숲 개장 행사\n<숲들이 DAY>"
    },
    {
      thumb: "assets/remote/figma-mobile-card-5.png",
      badge: "픽제주 이벤트",
      title: "러닝 초보자 클래스\n<웃으며 달리는 방법>"
    },
  ];

  const getMobileOverride = (post, size, index) => {
    if (post?.mobileThumb || post?.mobileBadge || post?.mobileTitle) {
      return {
        thumb: post.mobileThumb ? String(post.mobileThumb) : "",
        badge: post.mobileBadge ? String(post.mobileBadge) : "",
        title: post.mobileTitle ? String(post.mobileTitle) : ""
      };
    }
    if (size === "lg" || size === "square") return {};
    if (index > 0) return MOBILE_CARD_OVERRIDES[(index - 1) % MOBILE_CARD_OVERRIDES.length];
    return {};
  };

  const resolveMobileThumb = (post, size, index) => {
    const override = getMobileOverride(post, size, index);
    if (override.thumb) return override.thumb;
    const thumb = String(post.thumb || "");
    if (size === "lg" || size === "square") return thumb.replace(/figma-main-banner-big\.png$/, "figma-mobile-hero.png");
    if (thumb.includes("figma-card-9.png")) return "assets/remote/figma-mobile-card-1.png";
    if (thumb.includes("figma-card-1.png")) return "assets/remote/figma-mobile-card-2.png";
    if (thumb.includes("figma-card-2.png")) return "assets/remote/figma-mobile-card-3.png";
    if (thumb.includes("figma-card-10.png")) return "assets/remote/figma-mobile-card-4.png";
    if (thumb.includes("figma-card-3.png")) return "assets/remote/figma-mobile-card-5.png";
    return "";
  };

  const resolveCardCopy = (post, size, index) => {
    const fallback = {
      badge: String(post.badge || ""),
      title: String(post.title || "")
    };
    if (!window.matchMedia?.(MOBILE_QUERY).matches) return fallback;
    const override = getMobileOverride(post, size, index);
    return {
      badge: override.badge || fallback.badge,
      title: override.title || fallback.title
    };
  };

  const arrangePostsForViewport = (posts) => {
    const arranged = [...posts];
    if (!window.matchMedia?.(MOBILE_QUERY).matches) return arranged;

    const firstFeatureIndex = arranged.findIndex((post, index) => index > 0 && getPostSize(post) === "square");
    if (firstFeatureIndex > 9) {
      const [feature] = arranged.splice(firstFeatureIndex, 1);
      arranged.splice(9, 0, feature);
    }
    return arranged;
  };

  const createCard = (post, index) => {
    const size = getPostSize(post);
    const article = document.createElement("article");
    article.className=`grid-item${size ?` ${size}` : ""}`;
    article.dataset.postIndex = String(index);
    article.tabIndex = 0;
    setCardAnimation(article, index);

    const item = document.createElement("div");
    item.className = `main-card${size === "lg" ? " main-card--hero" : ""}${size === "square" ? " main-card--feature" : ""}`;

    const thumb = document.createElement("div");
    thumb.className="main-card__media";

    const picture = document.createElement("picture");
    const mobileThumb = resolveMobileThumb(post, size, index);
    if (mobileThumb) {
      const source = document.createElement("source");
      source.media = "(max-width: 767px)";
      source.srcset = resolveAssetUrl(mobileThumb);
      picture.append(source);
    }

    const image = document.createElement("img");
    image.className="main-card__image";
    image.src = resolveAssetUrl(post.thumb);
    image.alt = String(post.title || post.badge || "");
    image.loading = size === "lg" || index === 0 ? "eager" : "lazy";
    image.decoding = "async";
    picture.append(image);
    thumb.append(picture);

    const body = document.createElement("div");
    body.className="main-card__content";
    const copy = resolveCardCopy(post, size, index);

    const badge = document.createElement("div");
    badge.className="main-card__category";
    badge.textContent = copy.badge;

    const title = document.createElement("h3");
    title.className="main-card__title";
    title.textContent = copy.title;

    body.append(badge, title);
    item.append(thumb, body);
    article.append(item);
    return article;
  };

  const renderPosts = (posts, startIndex = 0) => {
    const fragment = document.createDocumentFragment();
    posts.forEach((post, offset) => {
      fragment.append(createCard(post, startIndex + offset));
    });
    return fragment;
  };

  const bindCard = (card, grid) => {
    if (card.dataset.gridBound === "true") return;
    card.dataset.gridBound = "true";

    const openDetail = () => {
      window.location.href = resolveDetailUrl(grid);
    };

    card.addEventListener("click", openDetail);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openDetail();
    });
  };

  ready(async () => {
    const grid = document.getElementById("main-content");
    const sentinel = document.getElementById("main-grid-sentinel");
    const status = document.getElementById("main-grid-status");
    if (!grid || !sentinel) return;

    const posts = arrangePostsForViewport(await readPosts(grid));
    if (posts.length === 0) return;

    const initialTarget = Math.max(Number.parseInt(grid.dataset.initialCount || "0", 10), grid.querySelectorAll(".grid-item").length);
    const initialCount = Math.min(initialTarget, posts.length);
    const batchSize = Math.max(Number.parseInt(grid.dataset.batchSize || "12", 10), 1);
    let cursor = initialCount;
    let loading = false;
    let done = cursor >= posts.length;
    let observer = null;

    grid.replaceChildren(renderPosts(posts.slice(0, initialCount), 0));
    grid.querySelectorAll(".grid-item").forEach((card) => bindCard(card, grid));
    layoutDesktopMasonry(grid);
    refreshAos();

    window.addEventListener("resize", () => scheduleDesktopMasonry(grid), { passive: true });

    const setLoading = (value) => {
      loading = value;
      grid.setAttribute("aria-busy", value ? "true" : "false");
      if (status) status.hidden = !value;
    };

    const stop = () => {
      done = true;
      if (status) status.hidden = true;
      if (observer) observer.unobserve(sentinel);
    };

    const renderNext = () => {
      if (loading || done) return;
      if (cursor >= posts.length) {
        stop();
        return;
      }

      setLoading(true);
      const slice = posts.slice(cursor, cursor + batchSize);
      const fragment = renderPosts(slice, cursor);
      Array.from(fragment.children).forEach((card) => bindCard(card, grid));

      requestAnimationFrame(() => {
        grid.append(fragment);
        cursor += slice.length;
        layoutDesktopMasonry(grid);
        refreshAos();
        setLoading(false);
        if (cursor >= posts.length) stop();
      });
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) renderNext();
      }, {
        root: null,
        rootMargin: "900px 0px",
        threshold: 0
      });
      observer.observe(sentinel);
    } else {
      const onScroll = () => {
        const triggerY = document.documentElement.scrollHeight - window.innerHeight - 900;
        if (window.scrollY >= triggerY) renderNext();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  });
})();
