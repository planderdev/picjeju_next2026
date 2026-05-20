/* ============================================================
 * qna.js — PICJEJU Q&A (독립모듈)
 * ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    qnaInitUploader();
    qnaInitWriteForm();
    qnaInitEdit();
    qnaInitDelete();
});

/* ------------------------------------------------------------
 * 업로더 (리뷰와 동일한 구조 + 클래스만 qna-로 변경)
 * ------------------------------------------------------------ */
function qnaInitUploader() {
    document.querySelectorAll("[data-qna-uploader]").forEach(form => {
        const input = form.querySelector(".qna-input");
        const grid  = form.querySelector(".qna-grid, .qna-edit-grid");

        if (!input || !grid) return;

        const state = { items: [], maxSize: 10 * 1024 * 1024 };

        // 파일 추가
        input.addEventListener("change", e => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (file.size > state.maxSize) return;

                const url = URL.createObjectURL(file);
                const id = "qna_" + Math.random().toString(36).slice(2);

                state.items.push({ id, file, url, blob: true });
            });

            qnaRenderThumbs(grid, state.items);
            input.value = "";
        });

        // 삭제 버튼 클릭
        grid.addEventListener("click", e => {
            const rm = e.target.closest("[data-qna-remove]");
            if (!rm) return;

            const id = rm.dataset.qnaRemove;
            const idx = state.items.findIndex(x => x.id === id);

            if (idx >= 0) {
                if (state.items[idx].blob && state.items[idx].url) {
                    URL.revokeObjectURL(state.items[idx].url);
                }
                state.items.splice(idx, 1);
                qnaRenderThumbs(grid, state.items);
            }
        });

        form.__qnaUploader = state;
    });
}

function qnaRenderThumbs(grid, items) {
    grid.innerHTML = "";
    items.forEach(({ id, url }) => {
        const wrap = document.createElement("div");
        wrap.className="qna-thumb";
        wrap.innerHTML = `
            <div class="thumb">
                <img src="${url}">
                <button type="button" class="remove" data-qna-remove="${id}">&times;</button>
            </div>
        `;
        grid.appendChild(wrap);
    });
}

/* ------------------------------------------------------------
 * 문의 작성
 * ------------------------------------------------------------ */
function qnaInitWriteForm() {
    const modal = document.getElementById("modalQna");
    if (!modal) return;

    const form = modal.querySelector("form");
    form.addEventListener("submit", e => {
        e.preventDefault();

        const content = form.querySelector("textarea[name='content']").value.trim();
        if (!content) {
            alert("내용을 입력해주세요."); 
            return;
        }

        const uploader = form.__qnaUploader;
        const imgs = uploader ? uploader.items.map(it => it.url) : [];

        qnaAddNew({
            question: content,
            images: imgs,
            created_at: today(),
            user: "나",
            answer: ""
        });

        // 초기화
        if (uploader) uploader.items = [];
        qnaRenderThumbs(form.querySelector(".qna-grid"), []);
        form.reset();

        picjejuUI.Modal.getInstance(modal)?.hide();
    });
}

function today() {
    return new Date().toISOString().slice(0, 16).replace("T", " ");
}

/* ------------------------------------------------------------
 * Q&A 목록에 바로 추가
 * ------------------------------------------------------------ */
function qnaAddNew(obj) {
    const list = document.querySelector(".qna-list");
    if (!list) return;

    const wrap = document.createElement("div");
    wrap.className="qna-item";

    wrap.innerHTML = `
        <div class="qna-question">
            <div class="qna-question-type">상품 문의</div>
            <div class="qna-question-text">${obj.question}</div>
            <div class="qna-question-meta">${obj.user} · ${obj.created_at}</div>
        </div>

        <div class="qna-actions">
            <button class="pj-button pj-button--link pj-u-p-0 qna-edit-btn">수정</button>
            <button class="pj-button pj-button--link pj-u-p-0 pj-u-text-danger qna-delete-btn">삭제</button>
        </div>
    `;

    list.prepend(wrap);
}

/* ------------------------------------------------------------
 * Q&A 수정
 * ------------------------------------------------------------ */
function qnaInitEdit() {
    const modal = document.getElementById("modalQnaEdit");
    if (!modal) return;

    let target = null;

    document.addEventListener("click", e => {
        const btn = e.target.closest(".qna-edit-btn");
        if (!btn) return;

        target = btn.closest(".qna-item");

        const content = target.querySelector(".qna-question-text").textContent.trim();
        modal.querySelector("textarea[name='content']").value = content;

        new picjejuUI.Modal(modal).show();
    });

    modal.querySelector("form").addEventListener("submit", e => {
        e.preventDefault();
        if (!target) return;

        const newContent = modal.querySelector("textarea[name='content']").value;
        target.querySelector(".qna-question-text").textContent = newContent;

        picjejuUI.Modal.getInstance(modal).hide();
    });
}

/* ------------------------------------------------------------
 * Q&A 삭제
 * ------------------------------------------------------------ */
function qnaInitDelete() {
    const modal = document.getElementById("modalQnaDelete");
    if (!modal) return;

    let target = null;

    document.addEventListener("click", e => {
        const btn = e.target.closest(".qna-delete-btn");
        if (!btn) return;

        target = btn.closest(".qna-item");
        new picjejuUI.Modal(modal).show();
    });

    modal.querySelector("#qnaDeleteConfirm")?.addEventListener("click", () => {
        if (target) target.remove();
        picjejuUI.Modal.getInstance(modal)?.hide();
    });
}
