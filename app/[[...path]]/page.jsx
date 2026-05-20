import { notFound } from "next/navigation";
import { pages } from "../../src/generated/page-content";

function escapeInvalidAngleText(html) {
  return html.replace(/<([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>/gi, "&lt;$1&gt;");
}

function getWriteCategoryQuery(pageKey) {
  const defaults = {
    event: "?primary=community-event",
    "event-calendar": "?primary=community-event",
    "board-news": "?primary=jeju-life-news&sub=jeju-news",
    "board-view": "?primary=jeju-life-news&sub=jeju-news",
    community: "?primary=jeju-life-news",
    "community-event": "?primary=community-event",
    "community-friends": "?primary=picjeju-friends",
    "community-tip": "?primary=community-tip",
    "single-view": "?primary=community-tip",
    "board-market": "?primary=market&sub=sale",
    "point-exchange": "?primary=point-exchange&sub=point-buy"
  };

  return defaults[pageKey] || "";
}

function fixPointExchangeLinks(html) {
  return html.replace(
    /(<a\b[^>]*href=(["']))((?:pages\/)?board-news\.html)(\2[^>]*>\s*픽포인트 거래소\s*<\/a>)/g,
    (_match, beforeHref, _quote, href, afterHref) => {
      const nextHref = href.startsWith("pages/") ? "pages/point-exchange.html" : "point-exchange.html";
      return `${beforeHref}${nextHref}${afterHref}`;
    }
  );
}

function wireFrontendWriteButtons(html, pageKey) {
  const linkedHtml = fixPointExchangeLinks(html);
  const writeHref = `/pages/board-write.html${getWriteCategoryQuery(pageKey)}`;

  return linkedHtml.replace(/<button\b([^>]*)>(\s*글쓰기\s*)<\/button>/g, (match, attributes, label) => {
    const nextAttributes = attributes.replace(/\sdata-pj-href=(["']).*?\1/g, "");
    return `<button${nextAttributes} data-pj-href="${writeHref}">${label}</button>`;
  });
}

function splitMain(html) {
  const mainStart = html.indexOf("<main");
  const mainEnd = html.indexOf("</main>", mainStart);

  if (mainStart < 0 || mainEnd < 0) {
    return { beforeMain: "", afterMain: "" };
  }

  return {
    beforeMain: html.slice(0, mainStart),
    afterMain: html.slice(mainEnd + "</main>".length)
  };
}

function getBoardWriteHtml() {
  const { beforeMain, afterMain } = splitMain(pages["board-news"]?.body || "");

  return `${beforeMain}
<main class="board-write-page">
  <section>
    <div class="page-title">
      <p>커뮤니티</p>
      <h3>게시글 작성</h3>
    </div>

    <div class="pj-container">
      <form id="frontBoardWriteForm" class="front-board-write" data-board-write-form data-endpoint="/api/posts" novalidate>
        <div class="front-board-write__panel">
          <div class="front-board-write__row front-board-write__row--split">
            <div>
              <label class="pj-label pj-u-fw-bold" for="boardPrimaryCategory">대분류 <span class="pj-u-text-primary">*</span></label>
              <select id="boardPrimaryCategory" name="primaryCategory" class="pj-field" required data-board-primary-category>
                <option value="">대분류를 선택해 주세요.</option>
                <option value="jeju-life-news">제주살이 뉴스</option>
                <option value="community-tip">제주살이 꿀팁</option>
                <option value="picjeju-friends">픽제주 친구들</option>
                <option value="community-event">이벤트</option>
                <option value="market">장터</option>
                <option value="point-exchange">픽포인트 거래소</option>
              </select>
            </div>
            <div>
              <label class="pj-label pj-u-fw-bold" for="boardSubCategory">하위분류 <span class="pj-u-text-primary">*</span></label>
              <select id="boardSubCategory" name="subCategory" class="pj-field" required data-board-sub-category>
                <option value="">대분류를 먼저 선택해 주세요.</option>
              </select>
            </div>
            <input id="boardCategory" name="category" type="hidden" value="">
          </div>

          <div class="front-board-write__row">
            <label class="pj-label pj-u-fw-bold" for="boardTitle">제목 <span class="pj-u-text-primary">*</span></label>
            <input id="boardTitle" name="title" class="pj-field" type="text" placeholder="제목을 입력해 주세요." required>
          </div>

          <div class="front-board-write__row">
            <label class="pj-label pj-u-fw-bold" for="boardSummary">요약</label>
            <input id="boardSummary" name="summary" class="pj-field" type="text" placeholder="목록에 노출할 한 줄 요약을 입력해 주세요.">
          </div>

          <div class="front-board-write__row front-board-write__row--split front-board-write__row--meta">
            <div>
              <label class="pj-label pj-u-fw-bold" for="boardAuthor">작성자</label>
              <input id="boardAuthor" name="author" class="pj-field" type="text" value="물비늘" readonly aria-readonly="true">
            </div>
            <div>
              <label class="pj-label pj-u-fw-bold" for="boardStatus">상태</label>
              <select id="boardStatus" name="status" class="pj-field">
                <option value="published">공개</option>
                <option value="private">비공개</option>
                <option value="draft">임시저장</option>
              </select>
            </div>
          </div>

          <div class="front-board-write__row front-board-write__options">
            <div class="pj-check">
              <input class="pj-check-input" type="checkbox" id="boardNotice" name="notice">
              <label class="pj-check-label" for="boardNotice">공지로 등록</label>
            </div>
            <div class="pj-check">
              <input class="pj-check-input" type="checkbox" id="boardComment" name="allowComment" checked>
              <label class="pj-check-label" for="boardComment">댓글 허용</label>
            </div>
          </div>

          <div class="front-board-write__row">
            <label class="pj-label pj-u-fw-bold" for="boardEditor">내용 <span class="pj-u-text-primary">*</span></label>
            <div class="front-editor front-editor--toast" data-board-editor>
              <div id="boardEditorFallback" class="front-editor__fallback" data-editor-fallback hidden>
                <textarea class="pj-field" rows="10" placeholder="에디터 로딩 실패시 내용을 입력해 주세요."></textarea>
              </div>
              <div id="boardEditor" class="front-editor__toast" data-editor-body data-placeholder="내용을 작성해 주세요."></div>
              <textarea name="content" class="pj-visually-hidden" data-editor-output required></textarea>
            </div>
          </div>

          <div class="front-board-write__row">
            <label class="pj-label pj-u-fw-bold" for="boardThumbnail">대표 이미지</label>
            <div class="front-board-write__uploader">
              <label class="pj-button pj-button--gray pj-button--md" for="boardThumbnail">이미지 선택</label>
              <input id="boardThumbnail" name="thumbnail" class="pj-visually-hidden" type="file" accept="image/*">
              <div class="front-board-write__thumb" data-board-thumb-preview aria-live="polite"></div>
            </div>
          </div>

          <div class="front-board-write__row">
            <label class="pj-label pj-u-fw-bold" for="boardFiles">첨부 파일</label>
            <div class="front-board-write__uploader">
              <label class="pj-button pj-button--gray pj-button--md" for="boardFiles">파일 첨부</label>
              <input id="boardFiles" name="files" class="pj-visually-hidden" type="file" multiple>
              <div class="front-board-write__files" data-board-file-list aria-live="polite"></div>
            </div>
          </div>

          <div class="front-board-write__actions">
            <div class="front-board-write__actions-left">
              <button type="button" class="pj-button pj-button--gray pj-button--md" data-board-cancel>취소</button>
              <button type="button" class="pj-button pj-button--line pj-button--md" data-board-draft>임시저장</button>
            </div>
            <div class="front-board-write__actions-right">
              <button type="submit" class="pj-button pj-button--primary pj-button--md">등록하기</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </section>
</main>
${afterMain}`;
}

function getPointExchangeHtml() {
  const { beforeMain, afterMain } = splitMain(pages["board-market"]?.body || "");

  return `${fixPointExchangeLinks(beforeMain)}
<main>
    <section>
        <div class="page-title">
            <p>커뮤니티</p>
            <h3>픽포인트 거래소</h3>
        </div>

        <div class="category-wrap">
            <ul>
                <li><a href="point-exchange.html" class="active">전체</a></li>
                <li><a href="point-exchange.html?category=buy">구해요</a></li>
                <li><a href="point-exchange.html?category=sell">팔아요</a></li>
                <li><a href="point-exchange.html?category=done">거래완료</a></li>
            </ul>
        </div>

        <div class="pj-container">
            <div class="page-pb-48">
                <div id="market-main" data-aos="fade-up" data-aos-duration="800">
                    <div class="sort">
                        <div class="pj-dropdown">
                            <button class="pj-button pj-dropdown-toggle" data-pj-toggle="dropdown">정렬</button>
                            <ul class="pj-dropdown-menu">
                                <li><a class="pj-dropdown-item" href="point-exchange.html?sort=latest">최신순</a></li>
                                <li><a class="pj-dropdown-item" href="point-exchange.html?sort=views">조회수순</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="list">
                        <ul>
                            <li class="notice">
                                <a href="board-view.html">
                                    <div class="left">
                                        <div class="num"><img src="../assets/images/svg/icon_notice_or.svg" alt="notice"></div>
                                        <div class="title">
                                            <div class="category"><span class="notice">공지</span></div>
                                            <span>픽포인트 거래소 이용 전 필독 공지</span>
                                        </div>
                                    </div>
                                    <div class="right">
                                        <div class="meta-l">
                                            <div class="author">물비늘</div>
                                            <div class="date">2025.08.28</div>
                                        </div>
                                        <div class="meta-r">
                                            <div class="view number">9999</div>
                                            <div class="reply number">999</div>
                                        </div>
                                    </div>
                                </a>
                            </li>

                            ${Array.from({ length: 8 }, (_, index) => {
                              const isSell = index % 2 === 0;
                              const status = index === 5 ? "거래완료" : isSell ? "팔아요" : "구해요";
                              const className = index === 5 ? "green" : isSell ? "yellow" : "blue";
                              const amount = [5000, 10000, 3000, 20000, 7000, 15000, 12000, 9000][index];
                              return `
                            <li>
                                <a href="board-view.html">
                                    <div class="left">
                                        <div class="thumbnail">
                                            <img src="../assets/remote/${isSell ? "433656892a6065896ed70f67e353808c73be2e59.jpeg" : "947e181736445396e260d57b7c35204e23fecd8a.png"}" alt="">
                                        </div>
                                        <div class="title">
                                            <div class="category"><span class="${className}">${status}</span></div>
                                            <span>${amount.toLocaleString("ko-KR")} Pic ${isSell ? "양도합니다" : "구합니다"}</span>
                                        </div>
                                    </div>
                                    <div class="right">
                                        <div class="meta-l">
                                            <div class="author">${index % 3 === 0 ? "물비늘" : "픽제주"}</div>
                                            <div class="date">2025.08.28</div>
                                        </div>
                                        <div class="meta-r">
                                            <div class="view number">${128 + index}</div>
                                            <div class="reply number">${index + 1}</div>
                                        </div>
                                    </div>
                                </a>
                            </li>`;
                            }).join("")}
                        </ul>
                    </div>
                </div>
            </div>

            <div id="page-wrap">
                <div class="page-nav">
                    <div>
                        <ul>
                            <li class="prev"><a href="#">이전</a></li>
                            <li><a href="#" class="active">1</a></li>
                            <li><a href="#">2</a></li>
                            <li><a href="#">3</a></li>
                            <li class="next"><a href="#">다음</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="list-back pj-u-d-flex pj-u-justify-content-end pj-u-mt-4">
                <button type="button" class="pj-button pj-button--primary pj-button--md" data-pj-href="/pages/board-write.html?primary=point-exchange&sub=point-buy">글쓰기</button>
            </div>
        </div>
    </section>
</main>
${fixPointExchangeLinks(afterMain)}`;
}

function normalizeSegment(value) {
  return String(value || "").replace(/\.html$/i, "");
}

async function resolveRoute(paramsPromise) {
  const params = await paramsPromise;
  const segments = Array.isArray(params?.path) ? params.path : [];

  if (segments.length === 0) {
    return { key: "index", page: pages.index };
  }

  if (segments.length === 1) {
    const key = normalizeSegment(segments[0]);
    if (key === "index") return { key: "index", page: pages.index };
    if (key === "board-write") {
      return {
        key,
        page: {
          title: "픽제주 - 게시글 작성",
          description: "픽제주 프론트 게시글 작성",
          keywords: "픽제주, 게시글, 글쓰기",
          body: getBoardWriteHtml()
        }
      };
    }
    if (key === "point-exchange") {
      return {
        key,
        page: {
          title: "픽제주 - 픽포인트 거래소",
          description: "픽포인트를 사고팔 수 있는 픽제주 거래소",
          keywords: "픽제주, 픽포인트, 거래소",
          body: getPointExchangeHtml()
        }
      };
    }
    return pages[key] ? { key, page: pages[key] } : null;
  }

  if (segments.length === 2 && segments[0] === "pages") {
    const key = normalizeSegment(segments[1]);
    if (key === "board-write") {
      return {
        key,
        page: {
          title: "픽제주 - 게시글 작성",
          description: "픽제주 프론트 게시글 작성",
          keywords: "픽제주, 게시글, 글쓰기",
          body: getBoardWriteHtml()
        }
      };
    }
    if (key === "point-exchange") {
      return {
        key,
        page: {
          title: "픽제주 - 픽포인트 거래소",
          description: "픽포인트를 사고팔 수 있는 픽제주 거래소",
          keywords: "픽제주, 픽포인트, 거래소",
          body: getPointExchangeHtml()
        }
      };
    }
    return pages[key] ? { key, page: pages[key] } : null;
  }

  return null;
}

export async function generateMetadata({ params }) {
  const route = await resolveRoute(params);
  const page = route?.page;

  if (!page) {
    return {};
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const logoUrl = new URL("/assets/images/logo.png", siteUrl).toString();

  return {
    metadataBase: new URL(siteUrl),
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    authors: [{ name: "랄라고고 주식회사" }],
    openGraph: {
      type: "website",
      title: page.title,
      description: page.description,
      images: [logoUrl]
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [logoUrl]
    }
  };
}

export default async function StaticPage({ params }) {
  const route = await resolveRoute(params);
  const page = route?.page;

  if (!page) {
    notFound();
  }

  const html = route.key === "board-write" ? page.body : wireFrontendWriteButtons(page.body, route.key);

  return (
    <div
      id="pj-next-page"
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: escapeInvalidAngleText(html) }}
    />
  );
}
