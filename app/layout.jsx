export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" href="/assets/images/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="/assets/css/design-system.css?v=20260520-select-svg" />
        <link rel="stylesheet" href="/assets/css/default.css" />
        <link rel="stylesheet" href="/assets/css/layout.css?v=20260513-layout" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/sub.css?v=20260514-figma-commerce-forms" />
        <link rel="stylesheet" href="/assets/css/post.css" />
        <link rel="stylesheet" href="/assets/css/store.css?v=20260514-figma-commerce-forms" />
        <link rel="stylesheet" href="/assets/css/board.css?v=20260520-actions" />
        <link rel="stylesheet" href="/assets/css/hover.css" />
        <link rel="stylesheet" href="/assets/css/ux-polish.css?v=20260520-actions" />
        <link
          rel="stylesheet"
          href="/assets/css/mobile.css?v=20260514-figma-commerce-forms"
          media="only screen and (max-width: 767px)"
        />
        <link rel="stylesheet" href="/assets/vendor/pretendard/pretendard.min.css" />
        <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/vendor/aos/aos.css" />
        <link rel="stylesheet" href="/assets/vendor/remixicon/remixicon.css" />
        <link rel="stylesheet" href="/assets/css/flatpickr.min.css" />
        <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var isPagesRoute = /^\\/pages(?:\\/|$)/.test(window.location.pathname);
                window.PICJEJU_ASSET_ROOT = isPagesRoute ? "../assets" : "assets";
                window.PICJEJU_PAGE_ROOT = isPagesRoute ? "." : "pages";
                window.picjejuAsset = function (path) {
                  return window.PICJEJU_ASSET_ROOT.replace(/\\/$/, '') + '/' + String(path || '').replace(/^\\//, '');
                };
                window.picjejuPage = function (path) {
                  return window.PICJEJU_PAGE_ROOT.replace(/\\/$/, '') + '/' + String(path || '').replace(/^\\//, '');
                };
              })();
            `
          }}
        />
        <script src="/assets/vendor/jquery/jquery-3.7.1.min.js" />
        <script src="/assets/vendor/gsap/gsap.min.js" />
        <script src="/assets/vendor/gsap/ScrollTrigger.min.js" />
        <script src="/assets/js/swiper-bundle.min.js" />
        <script src="/assets/vendor/aos/aos.js" />
        <script src="https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js" />
        <script src="/assets/js/default.js" />
        <script src="/assets/js/board.js" />
        <script src="/assets/js/board-write.js?v=20260520-point-category" defer />
        <script src="/assets/js/design-system.js?v=20260520-select-svg" />
      </head>
      <body className="is-logged-in pj-page-loading" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
