/* =========================================================
 * cart.js — FINAL ALL-IN-ONE
 * ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    const chkAll = $('#chk-all');
    const itemChecks = $$('.item-check');
    const btnDelete = $('#pj-button--delete-selected');

    const modalEl = document.querySelector('#modalDeleteConfirm');
    const modal = modalEl ? new picjejuUI.Modal(modalEl) : null;
    let deleteTarget = null;

    /* ---------------------------------------------
     * 합계 계산
     * --------------------------------------------- */
    function recalcTotals() {
        let sumProducts = 0;
        let sumShipping = 0;

        // 옵션 합계
        document.querySelectorAll('[data-opt-sum]').forEach(opt => {
            const v = Number(opt.textContent.replace(/[^0-9]/g, ''));
            sumProducts += v;
        });

        // 배송비
        document.querySelectorAll('.pj-u-order-store-group').forEach(group => {
            const txt = group.querySelector('.pj-u-order-store-footer .ship')?.textContent || '';
            if (!txt.includes('무료')) {
                sumShipping += Number(txt.replace(/[^0-9]/g, ''));
            }
        });

        $('#calc-sum-products').textContent = sumProducts.toLocaleString() + '원';
        $('#calc-sum-shipping').textContent = sumShipping.toLocaleString() + '원';
        $('#calc-sum-final').textContent = (sumProducts + sumShipping).toLocaleString() + '원';
    }

    /* ---------------------------------------------
     * 빈 장바구니 체크 (삭제 후만)
     * --------------------------------------------- */
    function checkEmptyCart() {
        const blocks = document.querySelectorAll('.cart-item-block');
        const emptyMsg = document.querySelector('#cart-empty-msg');
        const cartSection = document.querySelector('#cart-items');
        if (blocks.length === 0) {
            emptyMsg?.classList.remove('d-none');
            cartSection?.classList.add('d-none');
        }
    }

    /* ---------------------------------------------
     * 수량 변경 (inc/dec 공통)
     * --------------------------------------------- */
    function updateQty(btn, type) {
        const wrap = btn.closest('.selected-item');
        const input = wrap.querySelector('.qty');
        const sumEl = wrap.querySelector('[data-opt-sum]');
        const unit = Number(sumEl.dataset.unit);  // 최초 단가 고정

        let q = Number(input.value) || 1;
        if (type === 'inc') q++;
        if (type === 'dec') q = Math.max(1, q - 1);

        input.value = q;
        sumEl.textContent = (unit * q).toLocaleString() + '원';
        recalcTotals();
    }

    /* ---------------------------------------------
     * 직접 입력 input 반영
     * --------------------------------------------- */
    document.addEventListener('input', e => {
        if (e.target.classList.contains('opt-qty')) {
            const wrap = e.target.closest('.selected-item');
            const sumEl = wrap.querySelector('[data-opt-sum]');
            const unit = Number(sumEl.dataset.unit);

            let q = Number(e.target.value) || 1;
            if (q < 1) q = 1;
            e.target.value = q;

            sumEl.textContent = (unit * q).toLocaleString() + '원';
            recalcTotals();
        }
    });

    /* ---------------------------------------------
     * 전체선택 / 개별선택
     * --------------------------------------------- */
    if (chkAll) {
        chkAll.addEventListener('change', () => {
            itemChecks.forEach(chk => chk.checked = chkAll.checked);
        });
        itemChecks.forEach(chk => {
            chk.addEventListener('change', () => {
                if (!chk.checked) chkAll.checked = false;
                else if ([...itemChecks].every(i => i.checked))
                    chkAll.checked = true;
            });
        });
    }

    /* ---------------------------------------------
     * 모달 — 삭제확정
     * --------------------------------------------- */
    $('#btnConfirmDelete')?.addEventListener('click', () => {
        if (!deleteTarget) return;

        // 옵션 삭제
        if (deleteTarget.classList?.contains('selected-item')) {
            const itemBlock = deleteTarget.closest('.cart-item-block');
            const siblings = itemBlock.querySelectorAll('.selected-item');
            if (siblings.length === 1) {
                itemBlock.remove();
            } else {
                deleteTarget.remove();
            }
        }
        // 상품 전체 삭제
        else if (deleteTarget.classList?.contains('cart-item-block')) {
            deleteTarget.remove();
        }
        // 선택상품 삭제 (묶음 remove)
        else if (typeof deleteTarget.remove === 'function') {
            deleteTarget.remove();
        }

        deleteTarget = null;
        modal?.hide();
        recalcTotals();
        checkEmptyCart(); // 삭제 후만 실행
    });

    /* ---------------------------------------------
     * 클릭 위임
     * --------------------------------------------- */
    document.addEventListener('click', e => {
        // 수량조절
        if (e.target.classList.contains('pj-button--opt-inc')) {
            updateQty(e.target, 'inc');
        }
        if (e.target.classList.contains('pj-button--opt-dec')) {
            updateQty(e.target, 'dec');
        }

        // 옵션 삭제
        if (e.target.classList.contains('pj-button--remove-opt')) {
            deleteTarget = e.target.closest('.selected-item');
            modal?.show();
        }

        // 선택상품 삭제
        if (e.target.id === 'pj-button--delete-selected') {
            const checked = [...itemChecks].filter(i => i.checked);
            if (!checked.length) {
                alert('상품을 선택해주세요');
                return;
            }
            const targets = checked.map(chk => chk.closest('.cart-item-block'));
            deleteTarget = { remove: () => targets.forEach(t => t.remove()) };
            modal?.show();
        }

        // 바로구매
        // 바로구매
        if (
            e.target.classList.contains('pj-button--buy-now') ||
            e.target.classList.contains('pj-button--buy')
        ) {
            location.href = window.picjejuPage
                ? window.picjejuPage('order.html')
                : 'order.html';
        }

    });

    // 초기 1회 계산
    recalcTotals();

});
