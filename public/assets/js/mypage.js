document.addEventListener('DOMContentLoaded', () => {
    const asset = window.picjejuAsset || ((path) => `/assets/${String(path || "").replace(/^\//, "")}`);

    /* ==========================================================
        0) 환경 체크
    ========================================================== */
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;



    /* ==========================================================
        1) GNB 아코디언
    ========================================================== */
    const accordionBtns = document.querySelectorAll('.gnb-accordion-btn');

    function initMypageNavActiveState() {
        const navs = document.querySelectorAll('.mypage-nav');
        if (!navs.length) return;

        const pageName = decodeURIComponent((window.location.pathname.split('/').pop() || 'mypage.html').split('?')[0]);
        const activePageMap = {
            'mypage-order-detail.html': 'mypage-order-list.html',
            'mypage-inquiry-write.html': 'mypage-inquiry.html'
        };
        const currentPage = activePageMap[pageName] || pageName;

        navs.forEach(nav => {
            const links = nav.querySelectorAll('a[href]');

            links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

                const linkPage = decodeURIComponent(href.split('/').pop().split('?')[0].split('#')[0]);
                if (linkPage !== currentPage) return;

                link.classList.add('active', 'is-active');
                link.setAttribute('aria-current', 'page');
                link.closest('li')?.classList.add('active', 'is-active');

                const sub = link.closest('.gnb-sub');
                if (sub) {
                    const parentBtn = sub.previousElementSibling;
                    sub.classList.add('show');
                    sub.style.display = '';

                    if (parentBtn?.classList.contains('gnb-accordion-btn')) {
                        parentBtn.classList.add('active', 'is-active');
                        parentBtn.setAttribute('aria-expanded', 'true');
                        parentBtn.closest('li')?.classList.add('active', 'is-active');
                    }
                }
            });
        });
    }

    function updateAccordionState() {
        const mobile = isMobile();

        accordionBtns.forEach(btn => {
            const icon = btn.querySelector('svg');
            const target = btn.nextElementSibling;

            if (mobile) {
                btn.removeAttribute('data-pj-toggle');
                btn.removeAttribute('data-pj-target');
                btn.removeAttribute('aria-expanded');
                btn.removeAttribute('aria-controls');
                btn.classList.toggle('active', btn.classList.contains('is-active'));

                if (target?.classList.contains('gnb-sub')) {
                    target.classList.remove('show');
                    target.style.display = 'none';
                }

                if (icon) icon.style.transform = 'rotate(0deg)';

            } else {
                btn.setAttribute('data-pj-toggle', 'collapse');

                const targetId = target?.id;
                if (targetId) {
                    btn.setAttribute('data-pj-target', `#${targetId}`);
                    btn.setAttribute('aria-controls', targetId);
                }

                if (target?.classList.contains('gnb-sub')) {
                    target.style.display = '';
                    if (btn.classList.contains('is-active')) {
                        target.classList.add('show');
                        btn.setAttribute('aria-expanded', 'true');
                    }
                }

                const opened = btn.getAttribute('aria-expanded') === 'true' || btn.classList.contains('is-active');
                btn.classList.toggle('active', opened);

                if (opened && icon) {
                    icon.style.transition = 'none';
                    icon.style.transform = 'rotate(180deg)';
                }

                btn.addEventListener('click', () => {
                    setTimeout(() => {
                        const openedNow = btn.getAttribute('aria-expanded') === 'true';
                        btn.classList.toggle('active', openedNow);
                        if (btn.classList.contains('is-active')) btn.classList.add('active');
                        if (icon) {
                            icon.style.transition = 'transform .4s ease';
                            icon.style.transform = openedNow ? 'rotate(180deg)' : 'rotate(0deg)';
                        }
                    }, 120);
                });
            }
        });
    }

    initMypageNavActiveState();
    updateAccordionState();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateAccordionState, 200);
    });



    /* ==========================================================
        2) 픽포인트 전송 모듈
    ========================================================== */
    const selectedMembers = document.getElementById('selectedMembers');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const searchBtn = document.getElementById('memberSearchBtn');
    const searchInputEl = document.getElementById('memberSearchInput');
    const resultList = document.getElementById('searchResultList');
    const selectAllControls = document.querySelectorAll('[data-select-all-members]');
    const addSelectedBtn = document.getElementById('addSelectedBtn');

    let deleteTarget = null;

    if (selectedMembers && searchBtn && resultList) {

        const dummyMembers = window.memberList || [];

        // 기본 4명만 표시
        dummyMembers.slice(0, 4).forEach(m => addMember(m, true));

        // 엔터 검색
        searchInputEl?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchBtn.click();
            }
        });

        // 검색 버튼
        searchBtn.addEventListener('click', () => {
            const keyword = searchInputEl.value.trim().toLowerCase();
            resultList.innerHTML = '';

            const results = dummyMembers.filter(m =>
                m.name.toLowerCase().includes(keyword) || m.email.toLowerCase().includes(keyword)
            );

            if (!results.length) {
                resultList.innerHTML = `<div class="search-null">검색 결과가 없습니다.</div>`;
                return;
            }

            results.forEach(m => {
                const row = document.createElement('div');
                row.className='member-item-row';

                const mobile = isMobile();

                if (mobile) {
                    row.innerHTML = `
                        <div class="check">
                            <input type="checkbox" class="pj-check-input member-check" data-name="${m.name}" data-email="${m.email}">
                        </div>
                        <div class="result-combined">
                            <span>${m.name}</span><br><span>${m.email}</span>
                        </div>
                    `;
                } else {
                    row.innerHTML = `
                        <div class="check">
                            <input type="checkbox" class="pj-check-input member-check" data-name="${m.name}" data-email="${m.email}">
                        </div>
                        <div class="result-name">${m.name}</div>
                        <div class="result-email">${m.email}</div>
                    `;
                }

                // 행 클릭 = 체크
                row.addEventListener('click', e => {
                    if (e.target.tagName.toLowerCase() === 'input') return;

                    const checkbox = row.querySelector('.member-check');
                    checkbox.checked = !checkbox.checked;

                    updateSelectAllState();
                });

                resultList.appendChild(row);
            });

            selectAllControls.forEach(control => {
                control.checked = false;
            });
        });

        // 전체선택
        selectAllControls.forEach(control => {
            control.addEventListener('change', function () {
                selectAllControls.forEach(peer => {
                    if (peer !== control) peer.checked = control.checked;
                });
                document.querySelectorAll('.member-check')
                    .forEach(chk => (chk.checked = this.checked));
            });
        });

        // 개별 체크 → 전체선택 갱신
        document.addEventListener('change', e => {
            if (e.target.classList.contains('member-check')) {
                updateSelectAllState();
            }
        });

        function updateSelectAllState() {
            const checks = [...document.querySelectorAll('.member-check')];
            const allChecked = checks.length > 0 && checks.every(c => c.checked);
            selectAllControls.forEach(control => {
                control.checked = allChecked;
            });
        }

        // 선택된 회원 추가
        addSelectedBtn.addEventListener('click', () => {
            const checked = document.querySelectorAll('.member-check:checked');
            if (!checked.length) return;

            checked.forEach(chk => {
                addMember({
                    name: chk.dataset.name,
                    email: chk.dataset.email
                });
            });

            picjejuUI.Modal.getInstance(document.getElementById('memberSearchModal')).hide();
        });

        // 회원 추가
        function addMember(member, skipCheck = false) {
            if (!skipCheck) {
                const exists = [...selectedMembers.querySelectorAll('.member-item')]
                    .some(e => e.dataset.email === member.email);
                if (exists) return;
            }

            const item = document.createElement('div');
            item.className='member-item';
            item.dataset.email = member.email;

            item.innerHTML = `
                <div class="name">
                    <span>${member.name}</span>
                    <span>${member.email}</span>
                </div>
                <button type="button" class="pj-button pj-button--md pj-button--remove pj-button--link"></button>
            `;

            item.querySelector('.pj-button--remove').addEventListener('click', () => {
                deleteTarget = item;
                new picjejuUI.Modal(document.getElementById('deleteConfirmModal')).show();
            });

            selectedMembers.appendChild(item);
        }

        // 삭제 확정
        confirmDeleteBtn?.addEventListener('click', () => {
            if (deleteTarget) deleteTarget.remove();
            deleteTarget = null;
            picjejuUI.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        });
    }



    /* ==========================================================
        2-1) Point history filters
    ========================================================== */
    const pointTabs = Array.from(document.querySelectorAll(".point-tab"));
    const pointSearchInput = document.getElementById("pointSearch");
    const pointRows = Array.from(document.querySelectorAll("#pointList .point-row:not(.point-head)"));

    if (pointTabs.length && pointRows.length) {
        let activePointType = pointTabs.find(tab => tab.classList.contains("active"))?.dataset.type || "all";

        const applyPointFilter = () => {
            const keyword = (pointSearchInput?.value || "").trim().toLowerCase();

            pointRows.forEach(row => {
                const matchesType = activePointType === "all" || row.dataset.type === activePointType;
                const matchesKeyword = !keyword || row.innerText.toLowerCase().includes(keyword);
                row.style.display = matchesType && matchesKeyword ? "" : "none";
            });
        };

        pointTabs.forEach(tab => {
            tab.type = "button";
            tab.setAttribute("aria-pressed", tab.dataset.type === activePointType ? "true" : "false");

            tab.addEventListener("click", () => {
                activePointType = tab.dataset.type || "all";

                pointTabs.forEach(item => {
                    const active = item === tab;
                    item.classList.toggle("active", active);
                    item.setAttribute("aria-pressed", active ? "true" : "false");
                });

                applyPointFilter();
            });
        });

        pointSearchInput?.addEventListener("input", applyPointFilter);
        applyPointFilter();
    }


    /* ==========================================================
        3) Order detail modal
    ========================================================== */
    document.addEventListener("click", e => {
        const btn = e.target.closest("[data-index]");
        if (!btn) return;

        const idx = btn.dataset.index;
        const data = window.orderData?.[idx];
        if (!data) return;

        const elNo     = document.querySelector("#d-order-no");
        const elDate   = document.querySelector("#d-order-date");
        const elPay    = document.querySelector("#d-payment-method");
        const elAddr   = document.querySelector("#d-addr");
        const elSum    = document.querySelector("#d-sum");
        const elShip   = document.querySelector("#d-shipping");
        const elTotal  = document.querySelector("#d-total");
        const listWrap = document.querySelector("#d-items");

        if (elNo)    elNo.textContent    = data.order_no;
        if (elDate)  elDate.textContent  = data.date;
        if (elPay)   elPay.textContent   = data.payment.method;
        if (elAddr)  elAddr.innerHTML    = `${data.address.name} / ${data.address.phone}<br>${data.address.addr}`;
        if (elSum)   elSum.textContent   = data.payment.product_sum.toLocaleString();
        if (elShip)  elShip.textContent  = data.payment.shipping.toLocaleString();
        if (elTotal) elTotal.textContent = data.payment.total.toLocaleString();

        if (listWrap) {
            listWrap.innerHTML = "";
            data.items.forEach(it => {
                listWrap.innerHTML += `
                    <div class="pj-u-d-flex pj-u-gap-3 pj-u-mb-3">
                        <img src="${it.thumb}" width="70" height="70" style="border-radius:8px;">
                        <div>
                            <div><strong>${it.title}</strong></div>
                            <div>${it.option}</div>
                            <div>${it.price.toLocaleString()}원 / ${it.qty}개</div>
                        </div>
                    </div>
                `;
            });
        }
    });

    function getMypageActionPage(path) {
        return window.picjejuPage ? window.picjejuPage(path) : path;
    }

    function getOrderActionContext(button) {
        const box = button.closest(".pj-u-order-box");
        const group = button.closest(".pj-u-order-date-group");
        const orderNoText = group?.querySelector(".pj-u-order-num")?.textContent || "";
        const dateText = group?.querySelector(".od-mo-date")?.textContent ||
            group?.querySelector(".pj-u-order-date-title")?.childNodes?.[0]?.textContent || "";

        return {
            orderNo: orderNoText.replace("주문번호", "").trim() || "123456789",
            date: dateText.trim(),
            status: box?.querySelector(".status-main")?.textContent.trim() || "",
            statusSub: box?.querySelector(".status-sub")?.textContent.trim() || "",
            thumb: box?.querySelector(".pj-u-order-item-thumb img")?.getAttribute("src") || "",
            brand: box?.querySelector(".pj-u-order-item-brand")?.textContent.trim() || "픽제주",
            title: box?.querySelector(".pj-u-order-item-title")?.textContent.trim() || "",
            option: box?.querySelector(".pj-u-order-item-option")?.textContent.trim() || ""
        };
    }

    function ensureOrderDeliveryModal() {
        let modal = document.getElementById("orderDeliveryModal");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.className = "pj-modal pj-fade order-delivery-modal";
        modal.id = "orderDeliveryModal";
        modal.tabIndex = -1;
        modal.setAttribute("aria-labelledby", "orderDeliveryModalTitle");
        modal.innerHTML = `
            <div class="pj-modal-dialog pj-modal-dialog--centered">
                <div class="pj-modal-content">
                    <div class="pj-modal-header">
                        <h5 class="pj-modal-title" id="orderDeliveryModalTitle">배송 조회</h5>
                        <button type="button" class="pj-button-close" data-pj-dismiss="modal" aria-label="닫기"></button>
                    </div>
                    <div class="pj-modal-body">
                        <div class="order-delivery-summary">
                            <div class="order-delivery-order"></div>
                            <div class="order-delivery-product"></div>
                            <div class="order-delivery-status"></div>
                        </div>
                        <ol class="order-delivery-steps" aria-label="배송 진행 상태">
                            <li data-step="ordered"><span>주문접수</span></li>
                            <li data-step="ready"><span>상품준비</span></li>
                            <li data-step="shipping"><span>배송중</span></li>
                            <li data-step="done"><span>배송완료</span></li>
                        </ol>
                    </div>
                    <div class="pj-modal-footer">
                        <button type="button" class="pj-button pj-button--primary" data-pj-dismiss="modal">확인</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    function openOrderDeliveryModal(context) {
        const modal = ensureOrderDeliveryModal();
        const steps = Array.from(modal.querySelectorAll(".order-delivery-steps li"));
        const status = `${context.status} ${context.statusSub}`.trim();
        const activeIndex = context.status.includes("완료") ? 3 : context.status.includes("배송") ? 2 : 1;

        modal.querySelector(".order-delivery-order").textContent = `주문번호 ${context.orderNo}`;
        modal.querySelector(".order-delivery-product").textContent = [context.title, context.option].filter(Boolean).join(" / ");
        modal.querySelector(".order-delivery-status").textContent = status || "배송 정보를 확인 중입니다.";

        steps.forEach((step, index) => {
            step.classList.toggle("is-complete", index <= activeIndex);
            step.classList.toggle("is-active", index === activeIndex);
        });

        if (window.picjejuUI?.Modal) {
            picjejuUI.Modal.getOrCreateInstance(modal).show();
        } else {
            alert(`${modal.querySelector(".order-delivery-order").textContent}\n${modal.querySelector(".order-delivery-status").textContent}`);
        }
    }

    function showOrderActionMessage(message) {
        if (window.picjejuToast) {
            window.picjejuToast(message);
        } else {
            alert(message);
        }
    }

    function resetOrderReviewStars(form) {
        const ratingInput = form.querySelector("input[name='rating']");
        if (ratingInput) ratingInput.value = "0";

        form.querySelectorAll(".rv-star").forEach(star => {
            const img = star.querySelector("img");
            if (img) img.src = asset("images/svg/icon_star.svg");
            star.classList.remove("active");
        });
    }

    function ensureOrderReviewModal() {
        let modal = document.getElementById("modalReview");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.className = "pj-modal pj-fade order-review-modal";
        modal.id = "modalReview";
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="pj-modal-dialog pj-modal-dialog--centered pj-modal--lg">
                <div class="pj-modal-content rv-write-modal">
                    <div class="pj-modal-header">
                        <h4 class="pj-modal-title">리뷰 작성하기</h4>
                        <button type="button" class="pj-button pj-button--link pj-button--close-or" data-pj-dismiss="modal" aria-label="닫기" title="닫기"></button>
                    </div>

                    <form class="rv-form needs-validation" data-review-uploader novalidate>
                        <div class="pj-modal-body">
                            <div class="rv-write-product">
                                <img src="${asset("remote/0c8219b40f8e980617cfaabdf324da4e15100e9b.svg")}" class="rv-write-thumb" alt="">
                                <div>
                                    <div class="rv-write-brand">픽제주</div>
                                    <div class="rv-write-name"></div>
                                    <div class="rv-write-option"></div>
                                </div>
                            </div>

                            <div class="rv-rating-wrap">
                                <div class="title">상품은 어떠셨나요?</div>
                                <div class="rv-stars-select">
                                    ${[1, 2, 3, 4, 5].map(value => `
                                        <button type="button" class="pj-button pj-button--link rv-star" data-value="${value}">
                                            <img src="${asset("images/svg/icon_star.svg")}" alt="">
                                        </button>
                                    `).join("")}
                                </div>
                                <input type="hidden" name="rating" value="0">
                            </div>

                            <div class="rv-rating-wrap">
                                <div class="title">어떤 점이 좋으셨나요?</div>
                                <div class="rv-card">
                                    <textarea class="pj-field rv-textarea" name="content" rows="4" placeholder="리뷰 내용을 입력해 주세요."></textarea>
                                    <div class="cmt-grid rv-grid"></div>
                                    <div class="rv-attach">
                                        <label class="pj-button pj-button--link pj-u-p-0 pj-u-m-0">
                                            <img src="${asset("images/svg/icon_photo.svg")}" alt="">
                                            <input type="file" class="pj-visually-hidden rv-input" accept="image/*" multiple>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="pj-modal-footer">
                            <button type="button" class="pj-button pj-button--gray" data-pj-dismiss="modal">취소</button>
                            <button type="submit" class="pj-button pj-button--primary">등록</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector(".rv-form");
        if (form) {
            if (typeof mypageRvInitUploaders === "function") {
                mypageRvInitUploaders(modal);
            }

            form.addEventListener("submit", event => {
                event.preventDefault();

                const rating = parseInt(form.querySelector("input[name='rating']")?.value || "0", 10);
                const content = form.querySelector("textarea[name='content']")?.value.trim() || "";

                if (!rating) return alert("별점을 선택해 주세요.");
                if (!content) return alert("리뷰 내용을 입력해 주세요.");

                const uploader = RV_UPLOADERS.get(form);
                if (uploader) uploader.cleanup();

                form.reset();
                resetOrderReviewStars(form);
                window.picjejuUI?.Modal?.getOrCreateInstance?.(modal)?.hide();
                showOrderActionMessage("리뷰가 등록되었습니다.");
            });
        }

        return modal;
    }

    function openOrderReviewModal(context) {
        const modal = ensureOrderReviewModal();
        const form = modal.querySelector(".rv-form");
        const thumb = modal.querySelector(".rv-write-thumb");
        const brand = modal.querySelector(".rv-write-brand");
        const name = modal.querySelector(".rv-write-name");
        const option = modal.querySelector(".rv-write-option");

        if (form) {
            const uploader = RV_UPLOADERS.get(form);
            if (uploader) uploader.cleanup();
            form.reset();
            resetOrderReviewStars(form);
        }

        if (thumb) thumb.src = context.thumb || thumb.src;
        if (brand) brand.textContent = context.brand || "픽제주";
        if (name) name.textContent = context.title || "상품명";
        if (option) option.textContent = [context.option, context.orderNo ? `주문번호 ${context.orderNo}` : ""].filter(Boolean).join(" / ");

        if (window.picjejuUI?.Modal) {
            picjejuUI.Modal.getOrCreateInstance(modal).show();
        }
    }

    function ensureOrderExchangeModal() {
        let modal = document.getElementById("modalExchange");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.className = "pj-modal pj-fade";
        modal.id = "modalExchange";
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="pj-modal-dialog pj-modal-dialog--centered pj-modal--lg">
                <form class="pj-modal-content exchange-write-modal" data-exchange-form novalidate>
                    <div class="pj-modal-header">
                        <h4 class="pj-modal-title">교환/반품 신청하기</h4>
                        <button class="pj-button pj-button--link pj-button--close-or" type="button" data-pj-dismiss="modal" aria-label="닫기" title="닫기"></button>
                    </div>

                    <div class="pj-modal-body">
                        <div class="exchange-write-product">
                            <img src="${asset("remote/fab7b8784ab081862cabcebe4515b0bb68036b6e.jpeg")}" class="exchange-write-thumb" alt="">
                            <div class="exchange-write-product-info">
                                <div class="exchange-write-brand">픽제주</div>
                                <div class="exchange-write-name"></div>
                                <div class="exchange-write-option"></div>
                            </div>
                        </div>

                        <div class="exchange-form-grid">
                            <div class="exchange-form-field">
                                <label class="pj-label" for="mypageExchangeType">신청 유형 <span class="pj-u-text-primary">*</span></label>
                                <select class="pj-select" id="mypageExchangeType" name="exchange_type" required>
                                    <option value="">유형을 선택하세요</option>
                                    <option value="교환">교환</option>
                                    <option value="반품">반품</option>
                                </select>
                            </div>

                            <div class="exchange-form-field">
                                <label class="pj-label" for="mypageExchangeOrderNo">주문번호 <span class="pj-u-text-primary">*</span></label>
                                <input class="pj-field" id="mypageExchangeOrderNo" name="order_no" type="text" required>
                            </div>

                            <div class="exchange-form-field">
                                <label class="pj-label" for="mypageExchangeReason">신청 사유 <span class="pj-u-text-primary">*</span></label>
                                <select class="pj-select" id="mypageExchangeReason" name="reason" required>
                                    <option value="">사유를 선택하세요</option>
                                    <option value="상품 파손/불량">상품 파손/불량</option>
                                    <option value="오배송">오배송</option>
                                    <option value="단순 변심">단순 변심</option>
                                    <option value="상품 정보와 다름">상품 정보와 다름</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>

                            <div class="exchange-form-field">
                                <label class="pj-label" for="mypageExchangePhone">연락처 <span class="pj-u-text-primary">*</span></label>
                                <input class="pj-field" id="mypageExchangePhone" name="phone" type="tel" placeholder="010-0000-0000" required>
                            </div>
                        </div>

                        <div class="exchange-form-field">
                            <label class="pj-label" for="mypageExchangeAddress">회수 주소 <span class="pj-u-text-primary">*</span></label>
                            <textarea class="pj-field" id="mypageExchangeAddress" name="address" rows="3" placeholder="상품 회수가 필요한 주소를 입력하세요." required></textarea>
                        </div>

                        <div class="exchange-form-field">
                            <label class="pj-label" for="mypageExchangeContent">상세 내용 <span class="pj-u-text-primary">*</span></label>
                            <textarea class="pj-field" id="mypageExchangeContent" name="content" rows="4" placeholder="상품 상태, 요청 사항, 수거 가능 시간 등을 입력하세요." required></textarea>
                        </div>

                        <div class="exchange-form-field">
                            <label class="pj-label" for="mypageExchangeEvidence">증빙 이미지</label>
                            <input class="pj-field" id="mypageExchangeEvidence" name="evidence" type="file" accept="image/*" multiple>
                            <div class="pj-form-text">파손/불량/오배송의 경우 사진을 첨부하면 더 빠르게 확인할 수 있습니다.</div>
                        </div>

                        <label class="pj-check exchange-agree" for="mypageExchangeAgree">
                            <input class="pj-check-input" type="checkbox" id="mypageExchangeAgree" name="agree" required>
                            <span class="pj-check-label">교환/반품 안내와 불가능 사유를 확인했습니다.</span>
                        </label>
                    </div>

                    <div class="pj-modal-footer">
                        <button type="button" class="pj-button pj-button--gray" data-pj-dismiss="modal">취소</button>
                        <button type="submit" class="pj-button pj-button--primary">신청</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector("[data-exchange-form]");
        form?.addEventListener("submit", event => {
            event.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            form.reset();
            window.picjejuUI?.Modal?.getOrCreateInstance?.(modal)?.hide();
            showOrderActionMessage("교환/반품 신청이 접수되었습니다.");
        });

        return modal;
    }

    function openOrderExchangeModal(context, actionText) {
        const modal = ensureOrderExchangeModal();
        const form = modal.querySelector("[data-exchange-form]");
        const typeSelect = form?.querySelector("select[name='exchange_type']");
        const orderInput = form?.querySelector("input[name='order_no']");
        const thumb = modal.querySelector(".exchange-write-thumb");
        const brand = modal.querySelector(".exchange-write-brand");
        const name = modal.querySelector(".exchange-write-name");
        const option = modal.querySelector(".exchange-write-option");

        form?.reset();

        if (typeSelect) {
            const hasExchangeText = actionText.includes("교환");
            const hasReturnText = actionText.includes("반품");
            typeSelect.value = hasExchangeText && !hasReturnText ? "교환" : hasReturnText && !hasExchangeText ? "반품" : "";
        }
        if (orderInput) orderInput.value = context.orderNo || "";
        if (thumb) thumb.src = context.thumb || thumb.src;
        if (brand) brand.textContent = context.brand || "픽제주";
        if (name) name.textContent = context.title || "상품명";
        if (option) option.textContent = context.option || "";

        if (window.picjejuUI?.Modal) {
            picjejuUI.Modal.getOrCreateInstance(modal).show();
        }
    }

    document.querySelectorAll(".pj-u-order-actions .pj-button").forEach(button => {
        button.type = "button";
    });

    document.addEventListener("click", e => {
        const button = e.target.closest(".pj-u-order-actions .pj-button");
        if (!button) return;

        const actionText = button.textContent.trim();
        const context = getOrderActionContext(button);

        if (actionText.includes("배송 조회")) {
            e.preventDefault();
            openOrderDeliveryModal(context);
            return;
        }

        if (actionText.includes("교환") || actionText.includes("반품")) {
            e.preventDefault();
            openOrderExchangeModal(context, actionText);
            return;
        }

        if (actionText.includes("리뷰 작성")) {
            e.preventDefault();
            openOrderReviewModal(context);
        }
    });



    /* ==========================================================
       4) 주문 검색 기능 (고급형 - 그룹 단위로 검색)
       - 주문 리스트 페이지에서만 사용
       - HTML: form#orderSearchForm, input#orderSearchInput
    ========================================================== */

    const orderSearchForm  = document.getElementById("orderSearchForm");
    const orderSearchInput = document.getElementById("orderSearchInput");

    if (orderSearchForm && orderSearchInput) {
        orderSearchForm.addEventListener("submit", e => {
            e.preventDefault();

            const keyword = orderSearchInput.value.trim().toLowerCase();
            const groups  = document.querySelectorAll(".pj-u-order-date-group");

            if (!groups.length) return;

            // 검색어 없으면 전체 표시
            if (!keyword) {
                groups.forEach(g => (g.style.display = ""));
                return;
            }

            groups.forEach(group => {
                const text = group.innerText.toLowerCase();

                if (text.includes(keyword)) {
                    group.style.display = "";

                    // 모바일일 경우 자동으로 해당 아코디언 펼쳐주기
                    const btn  = group.querySelector(".pj-u-order-toggle-btn");
                    const body = group.querySelector(".pj-u-order-group-body");
                    const icon = btn?.querySelector("svg");

                    if (btn && body && isMobile()) {
                        btn.classList.add("active");
                        body.classList.remove("closed");
                        if (icon) icon.style.transform = "rotate(180deg)";
                    }
                } else {
                    group.style.display = "none";
                }
            });
        });
    }



    /* ==========================================================
       리뷰 검색 기능 (리뷰 작성하기 탭 — .review-box 기준)
       - HTML: form#reviewSearchForm, input#reviewSearchInput
    ========================================================== */

    const reviewSearchForm  = document.getElementById("reviewSearchForm");
    const reviewSearchInput = document.getElementById("reviewSearchInput");

    if (reviewSearchForm && reviewSearchInput) {
        reviewSearchForm.addEventListener("submit", e => {
            e.preventDefault();
            const keyword = reviewSearchInput.value.trim().toLowerCase();
            const items   = document.querySelectorAll(".review-box");

            if (!items.length) return;

            if (!keyword) {
                items.forEach(box => (box.style.display = ""));
                return;
            }

            items.forEach(box => {
                const text = box.innerText.toLowerCase();
                box.style.display = text.includes(keyword) ? "" : "none";
            });
        });
    }



    /* ==========================================================
       5) 모바일 주문 아코디언 (기본적으로 모두 펼쳐짐)
    ========================================================== */

    function initMobileOrderAccordion() {
        const mobile = isMobile();
        const groups = document.querySelectorAll(".pj-u-order-date-group");

        if (!groups.length) return;

        groups.forEach(group => {
            const btn  = group.querySelector(".pj-u-order-toggle-btn");
            const body = group.querySelector(".pj-u-order-group-body");
            const icon = btn?.querySelector("svg");

            if (!btn || !body) return;

            if (mobile) {
                // 기본: 펼쳐진 상태
                btn.classList.add("active");
                body.classList.remove("closed");

                if (icon) {
                    icon.style.transition = "transform .35s ease";
                    icon.style.transform = "rotate(180deg)";
                }

                btn.onclick = () => {
                    const isOpen = btn.classList.contains("active");

                    if (isOpen) {
                        btn.classList.remove("active");
                        body.classList.add("closed");
                        if (icon) icon.style.transform = "rotate(0deg)";
                    } else {
                        btn.classList.add("active");
                        body.classList.remove("closed");
                        if (icon) icon.style.transform = "rotate(180deg)";
                    }
                };

            } else {
                // PC에서는 항상 펼침
                btn.classList.add("active");
                body.classList.remove("closed");
                if (icon) {
                    icon.style.transition = "none";
                    icon.style.transform = "rotate(180deg)";
                }
                btn.onclick = null;
            }
        });
    }

    initMobileOrderAccordion();
    window.addEventListener("resize", initMobileOrderAccordion);



    /* ==========================================================
       6) 마이페이지 리뷰 시스템 초기화
    ========================================================== */
    if (typeof mypageRvInitSwiper === "function")          mypageRvInitSwiper();
    if (typeof mypageRvInitUploaders === "function")       mypageRvInitUploaders();
    if (typeof mypageRvInitWriteForm === "function")       mypageRvInitWriteForm();
    if (typeof mypageRvInitEditForm === "function")        mypageRvInitEditForm();
    if (typeof mypageRvInitDelete === "function")          mypageRvInitDelete();
    if (typeof mypageRvInitReport === "function")          mypageRvInitReport();
    if (typeof mypageRvInitLightbox === "function")        mypageRvInitLightbox();
    if (typeof mypageRvInitStarDelegation === "function")  mypageRvInitStarDelegation();
    if (typeof mypageRvApplyRatingFilter === "function")   mypageRvApplyRatingFilter();

}); // ← DOMContentLoaded 끝



/* ============================================================
 * 마이페이지 상품 리뷰 — JS
 * (review.js 기능을 mypage-rv 네임스페이스로 사용)
 * ============================================================ */

const mypageRvAsset = window.picjejuAsset || ((path) => `/assets/${String(path || "").replace(/^\//, "")}`);
const RV_UPLOADERS = new Map();

/* ----------------- 공통 유틸 ----------------- */
function rvGetRatingFromItem(item) {
  return parseInt(item.getAttribute("data-rating"), 10) || 0;
}

function mypageRvToggleEmptyState() {
  const items = document.querySelectorAll(".mypage-rv-item");
  const empty = document.querySelector(".mypage-rv-empty");
  if (!empty) return;

  let hasVisible = false;
  items.forEach(i => { if (i.style.display !== "none") hasVisible = true; });
  empty.style.display = hasVisible ? "none" : "block";
}

function mypageRvApplyRatingFilter() {
  // 현재는 별도 필터 없음 → 비어있는 상태만 처리
  mypageRvToggleEmptyState();
}

/* ----------------- Swiper ----------------- */
function mypageRvInitSwiper() {
  document.querySelectorAll(".mypage-rv-images.swiper").forEach(el => {
    if (el.swiper) return;
    new Swiper(el, {
      slidesPerView: 6.5,
      spaceBetween: 8,
      freeMode: false,
      slidesPerGroup: 1,  
      breakpoints: {
        0:   { slidesPerView: 3.5, slidesPerGroup: 1, spaceBetween: 10 },
        768: { slidesPerView: 6.5, slidesPerGroup: 1, spaceBetween: 8 }
      }
    });
  });
}


/* ----------------- 업로더 ----------------- */
function mypageRvInitUploaders(root = document) {
  const forms = root.querySelectorAll("[data-review-uploader]:not([data-review-uploader-init])");
  forms.forEach(form => {
    const uploader = mypageRvSetupUploader(form);
    if (uploader) RV_UPLOADERS.set(form, uploader);
  });
}

function mypageRvSetupUploader(form) {
  form.setAttribute("data-review-uploader-init", "true");

  const input = form.querySelector(".mypage-rv-input, .rv-input");
  const grid  = form.querySelector(".mypage-rv-grid, .mypage-rv-edit-grid, .rv-grid, .rv-edit-grid");
  if (!input || !grid) return null;

  const state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };

  const cleanup = () => {
    state.items.forEach(it => {
      if (it.blob && it.url) URL.revokeObjectURL(it.url);
    });
    state.items = [];
    mypageRvRenderThumbs(grid, state.items);
  };

  input.addEventListener("change", e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > state.maxSize) return;
      const url = URL.createObjectURL(file);
      const id  = "rv_" + Math.random().toString(36).slice(2);
      state.items.push({ id, file, url, blob: true });
    });
    mypageRvRenderThumbs(grid, state.items);
    input.value = "";
  });

  form.addEventListener("click", e => {
    const rm = e.target.closest("[data-rv-remove]");
    if (!rm) return;
    const id = rm.getAttribute("data-rv-remove");
    const idx = state.items.findIndex(x => x.id === id);
    if (idx >= 0) {
      if (state.items[idx].blob && state.items[idx].url) URL.revokeObjectURL(state.items[idx].url);
      state.items.splice(idx, 1);
      mypageRvRenderThumbs(grid, state.items);
    }
  });

  return { state, grid, input, cleanup };
}

function mypageRvRenderThumbs(grid, items) {
  grid.innerHTML = "";
  items.forEach(({ id, url }) => {
    const col = document.createElement("div");
    col.className="mypage-rv-thumb";
    col.innerHTML = `
      <div class="thumb pj-u-position-relative">
        <img src="${url}" alt="">
        <button type="button" class="pj-button pj-button--link remove" data-rv-remove="${id}">&times;</button>
      </div>`;
    grid.appendChild(col);
  });
}

/* ----------------- 별점 클릭 Delegation ----------------- */
function mypageRvInitStarDelegation() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".mypage-rv-star, .rv-star");
    if (!btn) return;

    const form  = btn.closest("form");
    const group = btn.closest(".mypage-rv-stars-select, .rv-stars-select");
    if (!group || !form) return;

    const input = form.querySelector("input[name='rating']");
    if (!input) return;

    const val = parseInt(btn.dataset.value, 10) || 0;
    input.value = val;

    const stars = group.querySelectorAll(".mypage-rv-star, .rv-star");
    stars.forEach((star, idx) => {
      const img = star.querySelector("img");
      if (!img) return;
      img.src = idx < val
        ? mypageRvAsset("images/svg/icon_star_fill.svg")
        : mypageRvAsset("images/svg/icon_star.svg");
      star.classList.toggle("active", idx < val);
    });
  });
}


/* ----------------- 리뷰 작성 (모달은 기존 rv-* 클래스 사용) ----------------- */
function mypageRvInitWriteForm() {
  const modal = document.getElementById("modalReview");
  if (!modal) return;

  const form = modal.querySelector(".rv-form");
  if (!form) return;

  const uploader = RV_UPLOADERS.get(form);

  form.addEventListener("submit", e => {
    e.preventDefault();

    const content = form.querySelector("textarea[name='content']").value.trim();
    const rating  = parseInt(form.querySelector("input[name='rating']").value || "0", 10);

    if (!rating) return alert("별점을 선택해주세요.");
    if (!content) return alert("내용을 입력해주세요.");

    const imgs = (uploader ? uploader.state.items : []).map(it => it.url);

    mypageRvAddNewReview({
      rating,
      content,
      images: imgs,
      created_at: new Date().toISOString().slice(0,16).replace("T"," ")
    });

    if (uploader) uploader.cleanup();
    form.reset();
    form.querySelector("input[name='rating']").value = 0;

    picjejuUI.Modal.getInstance(modal)?.hide();
  });
}

function mypageRvAddNewReview(obj) {
  const list = document.querySelector(".mypage-rv-list");
  if (!list) return;

  const div  = document.createElement("div");

  div.className="mypage-rv-item";
  div.dataset.rating = obj.rating;

  div.innerHTML = `
    <div class="mypage-rv-head pj-u-d-flex pj-u-gap-3 pj-u-mb-2">
      <img src="${mypageRvAsset("images/avatar-sample.png")}" class="avatar pj-u-rounded" alt="">
      <div class="meta">
        <div class="name pj-u-fw-bold">나</div>
        <div class="stars">${mypageRvGenStars(obj.rating)}</div>
      </div>
    </div>

    <div class="mypage-rv-content pj-u-mt-2">${obj.content}</div>

    ${
      obj.images && obj.images.length
        ? `
    <div class="mypage-rv-images swiper pj-u-mt-3">
      <div class="swiper-wrapper">
        ${obj.images.map(u => `<div class="swiper-slide"><img src="${u}" alt=""></div>`).join("")}
      </div>
    </div>`
        : ""
    }

    <div class="mypage-rv-bottom">
      <span class="date pj-u-text-muted small">${obj.created_at}</span>
      <div class="cta">
          <button type="button" class="pj-button pj-button--link pj-u-p-0 mypage-rv-edit">수정</button>
          <span class="cta-divider" aria-hidden="true">|</span>
          <button type="button" class="pj-button pj-button--link pj-u-p-0 mypage-rv-delete">삭제</button>
      </div>
    </div>
  `;

  list.prepend(div);

  mypageRvInitSwiper();
  mypageRvApplyRatingFilter();
}

function mypageRvGenStars(n) {
  let html = "";
  for (let i=1;i<=5;i++) {
    html += `<img src="${mypageRvAsset(`images/svg/${i<=n?'icon_star_fill.svg':'icon_star.svg'}`)}" alt="">`;
  }
  return html;
}


/* ----------------- 리뷰 수정 ----------------- */
function mypageRvInitEditForm() {
  const modal = document.getElementById("modalReviewEdit");
  if (!modal) return;

  const form      = modal.querySelector(".rv-edit-form");
  const grid      = modal.querySelector(".rv-edit-grid");
  const inputFile = modal.querySelector(".rv-edit-input");
  if (!form || !grid || !inputFile) return;

  let target = null;
  let state = { items: [] };

  document.addEventListener("click", e => {
    const btn = e.target.closest(".mypage-rv-edit");
    if (!btn) return;

    target = btn.closest(".mypage-rv-item");
    if (!target) return;

    const rating  = rvGetRatingFromItem(target);
    const content = target.querySelector(".mypage-rv-content")?.innerText.trim() || "";
    const brand = target.querySelector(".mypage-rv-head .brand")?.textContent.trim() || "";
    const title = target.querySelector(".mypage-rv-head .title")?.textContent.trim() || "";
    const option = target.querySelector(".mypage-rv-head .option")?.textContent.trim() || "";

    form.querySelector("input[name='review_id']").value = target.dataset.reviewId || "";
    form.querySelector("textarea[name='content']").value = content;
    form.querySelector("input[name='rating']").value     = rating;
    modal.querySelector("[data-rv-edit-brand]").textContent = brand;
    modal.querySelector("[data-rv-edit-title]").textContent = title;
    modal.querySelector("[data-rv-edit-option]").textContent = option;

    const stars = modal.querySelectorAll(".rv-edit-stars .rv-star");
    stars.forEach((star, idx) => {
      const img = star.querySelector("img");
      if (!img) return;
      img.src = idx < rating
        ? mypageRvAsset("images/svg/icon_star_fill.svg")
        : mypageRvAsset("images/svg/icon_star.svg");
      star.classList.toggle("active", idx < rating);
    });

    state.items = [];
    const imgs = target.querySelectorAll(".mypage-rv-images img");
    imgs.forEach((img, idx) => {
      state.items.push({
        id: "orig_" + idx,
        url: img.src,
        file: null,
        blob: false
      });
    });
    mypageRvRenderThumbs(grid, state.items);

    new picjejuUI.Modal(modal).show();
  });

  inputFile.addEventListener("change", e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      state.items.push({
        id: "edit_" + Math.random().toString(36).slice(2),
        url,
        file,
        blob: true
      });
    });
    mypageRvRenderThumbs(grid, state.items);
    inputFile.value = "";
  });

  grid.addEventListener("click", e => {
    const rm = e.target.closest("[data-rv-remove]");
    if (!rm) return;
    const id  = rm.getAttribute("data-rv-remove");
    const idx = state.items.findIndex(x => x.id === id);
    if (idx >= 0) {
      if (state.items[idx].blob && state.items[idx].url) URL.revokeObjectURL(state.items[idx].url);
      state.items.splice(idx, 1);
      mypageRvRenderThumbs(grid, state.items);
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!target) return;

    const rating  = parseInt(form.querySelector("input[name='rating']").value || "0", 10);
    const content = form.querySelector("textarea[name='content']").value.trim();
    if (!rating) return alert("별점을 선택해 주세요.");
    if (!content) return alert("리뷰 내용을 입력해 주세요.");

    target.dataset.rating = rating;
    target.querySelector(".mypage-rv-content").innerHTML = content.replace(/\n/g, "<br>");
    const starBox = target.querySelector(".stars");
    if (starBox) starBox.innerHTML = mypageRvGenStars(rating);

    const imageBox = target.querySelector(".mypage-rv-images");
    const wrap = imageBox?.querySelector(".swiper-wrapper");
    if (imageBox?.swiper) imageBox.swiper.destroy(true, true);

    if (wrap && state.items.length) {
      wrap.innerHTML = state.items
        .map(it => `<div class="swiper-slide"><img src="${it.url}" alt=""></div>`)
        .join("");
    } else if (imageBox && !state.items.length) {
      imageBox.remove();
    } else if (state.items.length) {
      const box = document.createElement("div");
      box.className="mypage-rv-images swiper";
      box.innerHTML = `
        <div class="swiper-wrapper">
          ${state.items.map(it => `<div class="swiper-slide"><img src="${it.url}" alt=""></div>`).join("")}
        </div>`;
      const bottom = target.querySelector(".mypage-rv-bottom");
      target.insertBefore(box, bottom);
    }

    picjejuUI.Modal.getInstance(modal)?.hide();
    mypageRvInitSwiper();
    mypageRvApplyRatingFilter();
  });
}


/* ----------------- 삭제 ----------------- */
function mypageRvInitDelete() {
  const modal = document.getElementById("modalReviewDelete");
  if (!modal) return;

  let target = null;

  document.addEventListener("click", e => {
    const btn = e.target.closest(".mypage-rv-delete");
    if (!btn) return;
    target = btn.closest(".mypage-rv-item");
    new picjejuUI.Modal(modal).show();
  });

  const confirmBtn = document.getElementById("rvDeleteConfirm");
  if (!confirmBtn) return;

  confirmBtn.addEventListener("click", () => {
    if (target) target.remove();
    picjejuUI.Modal.getInstance(modal)?.hide();
    mypageRvApplyRatingFilter();
  });
}


/* ----------------- 신고 ----------------- */
function mypageRvInitReport() {
  const modal = document.getElementById("modalReport");
  if (!modal) return;

  const form = modal.querySelector("form");
  if (!form) return;

  document.addEventListener("click", e => {
    const btn = e.target.closest(".mypage-rv-report");
    if (!btn) return;
    // 필요하면 여기서 review-id 세팅 가능
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    picjejuUI.Modal.getInstance(modal)?.hide();
    alert("신고가 접수되었습니다.");
  });
}


/* ----------------- 라이트박스 ----------------- */
function mypageRvInitLightbox() {
  if (window.__mypageImageLightboxBound) return;
  window.__mypageImageLightboxBound = true;

  document.addEventListener("click", e => {
    const img = e.target.closest(".mypage-rv-images img, .mypage-comment-images img");
    if (!img) return;

    const swiper = img.closest(".swiper")?.swiper;
    if (swiper && swiper.allowClick === false) return;

    e.preventDefault();
    mypageOpenImageLightbox(img);
  });
}

function mypageOpenImageLightbox(activeImg) {
  const gallery = activeImg.closest(".mypage-rv-images, .mypage-comment-images");
  const images = gallery ? Array.from(gallery.querySelectorAll("img")) : [activeImg];
  const srcs = images
    .map(img => img.currentSrc || img.getAttribute("src") || img.src)
    .filter(Boolean);

  if (!srcs.length) return;

  let activeIndex = Math.max(images.indexOf(activeImg), 0);
  const existing = document.querySelector(".mypage-image-lightbox");
  if (existing) {
    existing.querySelector(".mypage-image-lightbox__close")?.click();
    if (document.body.contains(existing)) existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = "mypage-image-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Image preview");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "mypage-image-lightbox__close";
  closeBtn.setAttribute("aria-label", "Close");

  const inner = document.createElement("div");
  inner.className = "mypage-image-lightbox__inner";

  const preview = document.createElement("img");
  preview.className = "mypage-image-lightbox__image";
  preview.alt = activeImg.alt || "";
  inner.appendChild(preview);

  let counter = null;
  let prevBtn = null;
  let nextBtn = null;

  const render = () => {
    preview.src = srcs[activeIndex];
    preview.alt = images[activeIndex]?.alt || activeImg.alt || "";
    if (counter) counter.textContent = `${activeIndex + 1} / ${srcs.length}`;
  };

  const move = (step) => {
    activeIndex = (activeIndex + step + srcs.length) % srcs.length;
    render();
  };

  if (srcs.length > 1) {
    prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "mypage-image-lightbox__arrow mypage-image-lightbox__arrow--prev";
    prevBtn.setAttribute("aria-label", "Previous image");

    nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "mypage-image-lightbox__arrow mypage-image-lightbox__arrow--next";
    nextBtn.setAttribute("aria-label", "Next image");

    counter = document.createElement("div");
    counter.className = "mypage-image-lightbox__counter";

    prevBtn.addEventListener("click", () => move(-1));
    nextBtn.addEventListener("click", () => move(1));
  }

  const previousOverflow = document.body.style.overflow;
  const close = () => {
    overlay.remove();
    document.body.style.overflow = previousOverflow;
    document.removeEventListener("keydown", onKeydown);
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft" && srcs.length > 1) move(-1);
    if (event.key === "ArrowRight" && srcs.length > 1) move(1);
  };

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });

  let touchStartX = null;
  overlay.addEventListener("touchstart", event => {
    if (srcs.length < 2) return;
    touchStartX = event.touches[0]?.clientX ?? null;
  }, { passive: true });

  overlay.addEventListener("touchend", event => {
    if (srcs.length < 2 || touchStartX === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const diffX = touchEndX - touchStartX;
    if (Math.abs(diffX) > 40) move(diffX > 0 ? -1 : 1);
    touchStartX = null;
  }, { passive: true });

  overlay.appendChild(closeBtn);
  if (prevBtn) overlay.appendChild(prevBtn);
  overlay.appendChild(inner);
  if (nextBtn) overlay.appendChild(nextBtn);
  if (counter) overlay.appendChild(counter);

  render();
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKeydown);
  closeBtn.focus();
}


/* ----------------- 업로더 동적 연결 ----------------- */
document.addEventListener("change", e => {
  const input = e.target.closest(".mypage-rv-input");
  if (!input) return;

  const form = input.closest("[data-review-uploader]");
  if (!form) return;

  if (!RV_UPLOADERS.has(form)) {
    const uploader = mypageRvSetupUploader(form);
    if (uploader) RV_UPLOADERS.set(form, uploader);
  }
});


/* ----------------- 작성한 리뷰 탭 전환 대응 ----------------- */
document.addEventListener("shown.ui.tab", e => {
  if (e.target.id === "wrote-tab") {
    mypageRvInitSwiper();
    mypageRvApplyRatingFilter();
  }
});




/* ==========================================================
   내가 작성한 게시물 검색 기능
   - HTML: form#postSearchForm, input#postSearchInput
   - 대상: .mypage-post-list .item
========================================================== */
const postSearchForm  = document.getElementById("postSearchForm");
const postSearchInput = document.getElementById("postSearchInput");

if (postSearchForm && postSearchInput) {
    postSearchForm.addEventListener("submit", e => {
        e.preventDefault();
        applyPostSearch();
    });

    // 입력 즉시 반응 (엔터 없이)
    postSearchInput.addEventListener("keyup", () => {
        applyPostSearch();
    });
}

function applyPostSearch() {
    const keyword = postSearchInput.value.trim().toLowerCase();
    const items   = document.querySelectorAll(".mypage-post-list .item");

    if (!items.length) return;

    // 검색어 없으면 초기화
    if (!keyword) {
        items.forEach(it => (it.style.display = ""));
        return;
    }

    items.forEach(it => {
        const text = it.innerText.toLowerCase();
        it.style.display = text.includes(keyword) ? "" : "none";
    });
}



/* ==========================================================
   나의 댓글 이미지 슬라이드 초기화
========================================================== */
function initCommentSwiper() {
    document.querySelectorAll(".mypage-comment-images.swiper").forEach(el => {
        if (el.swiper) return;
        new Swiper(el, {
            slidesPerView: 4.5,
            spaceBetween: 8,
            breakpoints: {
                0:   { slidesPerView: 2.5, spaceBetween: 10 },
                768: { slidesPerView: 4.5, spaceBetween: 8 }
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initCommentSwiper();
});


/* ==========================================================
   나의 댓글 검색 기능
========================================================== */
const commentSearchForm  = document.getElementById("commentSearchForm");
const commentSearchInput = document.getElementById("commentSearchInput");

if (commentSearchForm && commentSearchInput) {
    commentSearchForm.addEventListener("submit", e => {
        e.preventDefault();
        applyCommentSearch();
    });

    commentSearchInput.addEventListener("keyup", () => {
        applyCommentSearch();
    });
}

function applyCommentSearch() {
    const keyword = commentSearchInput.value.trim().toLowerCase();
    const items   = document.querySelectorAll(".mypage-comment-list .item");

    if (!items.length) return;

    items.forEach(it => {
        const txt = it.innerText.toLowerCase();
        it.style.display = txt.includes(keyword) ? "" : "none";
    });
}



document.addEventListener("DOMContentLoaded", () => {
    const btnPoint = document.getElementById("btnPoint");

    if (!btnPoint) return;

    btnPoint.addEventListener("click", (e) => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (isMobile) {
            e.preventDefault(); // 아코디언 동작 막기
            window.location.href = window.picjejuPage
                ? window.picjejuPage("mypage-point-status.html")
                : "mypage-point-status.html"; // 이동할 페이지
        }
    });
});




/* ==========================================================
   댓글 수정 모달 (텍스트 + 이미지 업로드 / 삭제 / 미리보기)
========================================================== */
(function () {
    const modal = document.getElementById("modalCommentEdit");
    if (!modal) return;
  
    const form = document.getElementById("commentEditForm");
    const ta = form.querySelector("textarea[name='content']");
    const input = form.querySelector(".rv-edit-input");
    const grid = form.querySelector(".rv-edit-grid");
  
    let target = null; // 수정할 원본 댓글 DOM
    let state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };
  
    /** 썸네일 렌더 */
    function renderThumbs() {
      grid.innerHTML = "";
      state.items.forEach(({ id, file, url }) => {
        const col = document.createElement("div");
        col.className="thum-preview";
        col.innerHTML = `
          <div class="thumb pj-u-position-relative">
            <img src="${url}" alt="${file?.name || "image"}">
            <button type="button" class="remove" data-rv-edit-remove="${id}"></button>
          </div>
        `;
        grid.appendChild(col);
      });
    }
  
    /** 파일 추가 */
    input.addEventListener("change", e => {
      const files = Array.from(e.target.files || []);
      files.forEach(file => {
        if (file.size > state.maxSize) return;
        const id = "f_" + Math.random().toString(36).slice(2);
        const url = URL.createObjectURL(file);
        state.items.push({ id, file, url });
      });
      input.value = "";
      renderThumbs();
    });
  
    /** 삭제 버튼 */
    grid.addEventListener("click", e => {
      const rm = e.target.closest("[data-rv-edit-remove]");
      if (!rm) return;
      const id = rm.getAttribute("data-rv-edit-remove");
      const idx = state.items.findIndex(x => x.id === id);
      if (idx > -1) {
        URL.revokeObjectURL(state.items[idx].url);
        state.items.splice(idx, 1);
        renderThumbs();
      }
    });
  
    /** 수정 버튼 클릭 → 데이터 주입 및 모달 열기 */
    document.addEventListener("click", e => {
      const btn = e.target.closest(".mypage-rv-edit"); // 수정 버튼
      if (!btn) return;
  
      target = btn.closest(".item");
      if (!target) return;
  
      // 텍스트 불러오기
      const desc = target.querySelector(".desc")?.innerText.trim() || "";
      ta.value = desc;
  
      // 기존 이미지들 불러오기
      state.items = [];
      target.querySelectorAll(".review-image img").forEach(img => {
        const url = img.getAttribute("src");
        const id = "e_" + Math.random().toString(36).slice(2);
        state.items.push({ id, file: null, url });
      });
      renderThumbs();
  
      picjejuUI.Modal.getOrCreateInstance(modal).show();
    });
  
    /** 저장 */
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!target) return;
  
      const newText = ta.value.trim();
      if (!newText) {
        alert("내용을 입력해주세요.");
        return;
      }
  
      // 텍스트 업데이트
      const descEl = target.querySelector(".desc");
      descEl.innerHTML = newText.replace(/\n/g, "<br>");
  
      // 이미지구역 업데이트
      const imgWrap = target.querySelector(".review-image");
      if (imgWrap) {
        imgWrap.innerHTML = "";
        state.items.forEach(({ url }) => {
          imgWrap.innerHTML += `<img src="${url}" alt="">`;
        });
      }
  
      picjejuUI.Modal.getInstance(modal).hide();
    });
  
  })();

  
  


  /* ==========================================================
   나의 문의 — 수정 / 삭제
========================================================== */
(function () {

    /* ====== 공통 ====== */
    const editModal = document.getElementById("modalMyQnaEdit");
    const deleteModal = document.getElementById("modalMyQnaDelete");
    if (!editModal) return;
  
    const form = document.getElementById("myQnaEditForm");
    if (!form) return;
    const titleInput = form.querySelector("input[name='title']");
    const ta = form.querySelector("textarea[name='content']");
    const input = form.querySelector(".myqna-edit-input");
    const grid = form.querySelector(".myqna-edit-grid");
    const confirmDeleteBtn = document.getElementById("confirmMyQnaDelete") || document.getElementById("rvDeleteConfirm");
    if (!titleInput || !ta || !input || !grid) return;
  
    let state = { items: [], maxFiles: 10, maxSize: 10 * 1024 * 1024 };
    let target = null;
  
    /* 썸네일 렌더 */
    function renderThumbs() {
      grid.innerHTML = "";
      state.items.forEach(({ id, file, url }) => {
        const col = document.createElement("div");
        col.className="thum-preview";
        col.innerHTML = `
          <div class="thumb pj-u-position-relative">
            <img src="${url}">
            <button type="button" class="remove" data-qna-remove="${id}"></button>
          </div>
        `;
        grid.appendChild(col);
      });
    }
  
    /* 파일 첨부 */
    input.addEventListener("change", e => {
      const files = [...e.target.files];
      files.forEach(file => {
        if (file.size > state.maxSize) return;
        const url = URL.createObjectURL(file);
        state.items.push({ id: "f_"+Math.random(), file, url });
      });
      renderThumbs();
      input.value = "";
    });
  
    /* 이미지 삭제 */
    grid.addEventListener("click", e => {
      const rm = e.target.closest("[data-qna-remove]");
      if (!rm) return;
      e.preventDefault();
      const id = rm.getAttribute("data-qna-remove");
      state.items = state.items.filter(x => x.id !== id);
      renderThumbs();
    });
  
    /* 수정 버튼 클릭 */
    document.addEventListener("click", e => {
      const btn = e.target.closest(".myqna-edit");
      if (!btn) return;
  
      target = btn.closest(".mypage-qna-item");
      if (!target) return;
  
      const title = target.querySelector(".mypage-qna-question")?.innerText.trim() || "";
      const desc = target.querySelector(".qna-text")?.innerText.trim() || target.dataset.qnaContent || "";
      titleInput.value = title;
      ta.value = desc;
      form.querySelector("input[name='qna_id']").value = target.dataset.qnaId || "";
  
      // 이미지 로드
      state.items = [];
      target.querySelectorAll(".qna-images img").forEach(img => {
        state.items.push({ id: "e_"+Math.random(), file: null, url: img.src });
      });
      renderThumbs();
  
      picjejuUI.Modal.getOrCreateInstance(editModal).show();
    });
  
    /* 수정 제출 */
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!target) return;
      const newTitle = titleInput.value.trim();
      const newText = ta.value.trim();
      const text = target.querySelector(".qna-text");
      if (!newTitle) return alert("제목을 입력해 주세요.");
      if (text && !newText) return alert("내용을 입력해 주세요.");
  
      const question = target.querySelector(".mypage-qna-question");
      if (question) question.textContent = newTitle;
      target.dataset.qnaContent = newText;

      if (text) text.innerHTML = newText.replace(/\n/g, "<br>");
  
      const wrap = target.querySelector(".qna-images");
      if (wrap) wrap.innerHTML = "";
      if (state.items.length) {
        if (!wrap) target.insertAdjacentHTML("beforeend", '<div class="qna-images"></div>');
        const wrap2 = target.querySelector(".qna-images");
        state.items.forEach(({ url }) => wrap2.innerHTML += `<img src="${url}">`);
      }
  
      picjejuUI.Modal.getInstance(editModal).hide();
    });
  
    /* 삭제 */
    let deleteTarget = null;
    document.addEventListener("click", e => {
      const btn = e.target.closest(".myqna-delete");
      if (!btn) return;
      deleteTarget = btn.closest(".mypage-qna-item");
      if (deleteModal) picjejuUI.Modal.getOrCreateInstance(deleteModal).show();
    });
  
    confirmDeleteBtn?.addEventListener("click", () => {
      if (deleteTarget) deleteTarget.remove();
      if (deleteModal) picjejuUI.Modal.getInstance(deleteModal)?.hide();
    });
  
  })();

  


