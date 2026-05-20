// member.js — 사용자 관리 전용 기능 (필터 제외)
(() => {
    "use strict";
  
    // === Bootstrap 가드 ===
    function withBootstrap(cb) {
      if (window.bootstrap) return cb();
      window.addEventListener("load", () => window.bootstrap && cb(), { once: true });
    }

    function parseNumber(value) {
      return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
    }

    function setText(selector, value) {
      const el = document.querySelector(selector);
      if (el) el.textContent = value;
    }

    function refreshMemberInsights() {
      const rows = Array.from(document.querySelectorAll("#userTable tbody tr"));
      const total = rows.length;
      const vip = rows.filter((tr) => tr.dataset.group === "VIP").length;
      const admin = rows.filter((tr) => getRowValue(tr, 3).includes("관리자")).length;
      const points = rows.reduce((sum, tr) => sum + parseNumber(getRowValue(tr, 6)), 0);

      setText("[data-member-total]", `${total.toLocaleString("ko-KR")}명`);
      setText("[data-member-vip]", `${vip.toLocaleString("ko-KR")}명`);
      setText("[data-member-admin]", `${admin.toLocaleString("ko-KR")}명`);
      setText("[data-member-points]", `${points.toLocaleString("ko-KR")}P`);
      setText("#countAll", String(total));
    }

    // --- 행 액션 드롭다운 & 메모 편집 ---
    let currentRow = null;
    const modalMemoEl = document.getElementById("modalMemo");
    const memoText = document.getElementById("memoText");
    const memoCount = document.getElementById("memoCount");
    const modalUserEditEl = document.getElementById("modalUserEdit");
    const editUserTitle = document.getElementById("editUserTitle");
    const editNick = document.getElementById("editNick");
    const editEmail = document.getElementById("editEmail");
    const editUserType = document.getElementById("editUserType");
    const editGroup = document.getElementById("editGroup");
    const editMemo = document.getElementById("editMemo");
    let memoModal = null;
    let userEditModal = null;
    withBootstrap(() => {
      if (modalMemoEl) memoModal = new bootstrap.Modal(modalMemoEl);
      if (modalUserEditEl) userEditModal = new bootstrap.Modal(modalUserEditEl);
    });
  
    function setCurrentRowFromTarget(target) {
      const tr = target.closest("tr");
      if (!tr) return null;
      currentRow = tr;
      return tr;
    }
  
    function showModalById(id) {
      const el = document.getElementById(id);
      if (!el) return;
      withBootstrap(() => new bootstrap.Modal(el).show());
    }
    function hideModalById(id) {
      const el = document.getElementById(id);
      if (!el) return;
      withBootstrap(() => bootstrap.Modal.getInstance(el)?.hide());
    }

    function getRowValue(tr, cellIndex) {
      return (tr?.children?.[cellIndex]?.textContent || "").trim();
    }

    function openUserEdit(tr) {
      if (!tr || !userEditModal) return;
      currentRow = tr;
      const nick = tr.dataset.nick || getRowValue(tr, 1);
      const email = tr.dataset.email || getRowValue(tr, 2);
      const type = getRowValue(tr, 3) || "일반회원";
      const group = getRowValue(tr, 4) || "그룹없음";
      const memo = tr.dataset.memo || tr.querySelector(".memo-text")?.textContent?.trim() || "";

      if (editUserTitle) editUserTitle.textContent = `${nick || email} 정보`;
      if (editNick) editNick.value = nick;
      if (editEmail) editEmail.value = email;
      if (editUserType) editUserType.value = type;
      if (editGroup) editGroup.value = group;
      if (editMemo) editMemo.value = memo;
      userEditModal.show();
    }

    function syncRowProfile(tr, data) {
      if (!tr) return;
      tr.dataset.nick = data.nick;
      tr.dataset.email = data.email;
      tr.dataset.id = data.email;
      tr.dataset.group = data.group === "그룹없음" ? "__NONE__" : data.group;
      tr.dataset.memo = data.memo;

      const nickButton = tr.querySelector("td:nth-child(2) .member-profile-trigger");
      const emailButton = tr.querySelector("td:nth-child(3) .member-profile-trigger");
      if (nickButton) nickButton.textContent = data.nick;
      if (emailButton) emailButton.textContent = data.email;
      if (tr.children[2]) tr.children[2].setAttribute("title", data.email);
      if (tr.children[3]) tr.children[3].textContent = data.type;
      if (tr.children[4]) tr.children[4].textContent = data.group;

      const memoCell = tr.querySelector(".memo-cell .memo-text");
      if (memoCell) memoCell.textContent = data.memo;
    }
  
    // 이벤트 위임
    document.addEventListener("click", (e) => {
      const a = e.target.closest(".row-action");
      if (a) {
        e.preventDefault();
        const tr = setCurrentRowFromTarget(a);
        if (!tr) return;
        const action = a.dataset.action;
        const nick = tr.dataset.nick || "";
        const email = tr.dataset.email || "";
  
        if (action === "delete") {
          if (confirm(`${nick || email} 사용자를 삭제할까요?`)) {
            tr.remove();
            refreshMemberInsights();
          }
          return;
        }
  
        if (action === "notify") {
          document.getElementById("notifyTarget").textContent = `${nick || email}에게 알림 전송`;
          document.getElementById("notifyTitle").value = "";
          document.getElementById("notifyBody").value = "";
          showModalById("modalNotify");
          return;
        }
  
        if (action === "sms") {
          document.getElementById("smsTarget").textContent = `${nick || email}에게 SMS 전송`;
          document.getElementById("smsPhone").value = "";
          document.getElementById("smsBody").value = "";
          showModalById("modalSMS");
          return;
        }
  
        if (action === "point") {
          document.getElementById("pointTarget").textContent = `${nick || email}의 적립금 조정`;
          document.getElementById("pointAmount").value = "";
          document.getElementById("pointReason").value = "";
          document.getElementById("pointPlus").checked = true;
          showModalById("modalPoint");
          return;
        }
      }
  
      // 메모 수정 버튼
      const profileTrigger = e.target.closest(".member-profile-trigger");
      if (profileTrigger) {
        e.preventDefault();
        const tr = setCurrentRowFromTarget(profileTrigger);
        openUserEdit(tr);
        return;
      }

      const editBtn = e.target.closest(".btn-edit-memo");
      if (editBtn) {
        const tr = setCurrentRowFromTarget(editBtn);
        if (!tr || !memoModal) return;
        const current = tr.dataset.memo || "";
        memoText.value = current;
        memoCount.textContent = String(current.length);
        memoModal.show();
      }
    });
  
    // 메모 글자수
    memoText?.addEventListener("input", () => {
      memoCount.textContent = String(memoText.value.length);
    });
  
    // 메모 저장
    document.getElementById("formMemo")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!currentRow) return;
      const val = (memoText.value || "").trim().slice(0, 500);
      currentRow.dataset.memo = val;
      const cell = currentRow.querySelector(".memo-cell .memo-text");
      if (cell) cell.textContent = val;
      hideModalById("modalMemo");
    });
  
    // 알림 전송 (데모)
    document.getElementById("formUserEdit")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!currentRow) return;
      const data = {
        nick: (editNick?.value || "").trim(),
        email: (editEmail?.value || "").trim(),
        type: editUserType?.value || "일반회원",
        group: editGroup?.value || "그룹없음",
        memo: (editMemo?.value || "").trim().slice(0, 500)
      };

      if (!data.nick || !data.email) {
        alert("닉네임과 계정을 입력해 주세요.");
        return;
      }

      syncRowProfile(currentRow, data);
      refreshMemberInsights();
      document.querySelector(".rail-list [data-filter-group].active")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      document.getElementById("searchInput")
        ?.dispatchEvent(new Event("input", { bubbles: true }));
      hideModalById("modalUserEdit");
      window.adminToast?.("사용자 정보가 수정되었습니다.", "success");
    });

    document.getElementById("formNotify")?.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("알림이 전송되었습니다. (데모)");
      hideModalById("modalNotify");
    });
  
    // SMS 전송 (데모)
    document.getElementById("formSMS")?.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("SMS가 전송되었습니다. (데모)");
      hideModalById("modalSMS");
    });
  
    // 적립금 적용 (데모)
    document.getElementById("formPoint")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = document.querySelector('input[name="pointType"]:checked')?.value || "plus";
      const amount = Number(document.getElementById("pointAmount").value || 0);
      const reason = document.getElementById("pointReason").value || "";
      if (!amount || amount < 1) {
        alert("금액을 확인해 주세요.");
        return;
      }
      alert(`적립금 ${type === "plus" ? "지급" : "차감"}: ${amount} 원\n사유: ${reason}\n(데모)`);
      hideModalById("modalPoint");
    });
  
    // --- 대량 업로드(데모) ---
    const bulkFile = document.getElementById("bulkFile");
    const bulkFileName = document.getElementById("bulkFileName");
    const btnBulkUpload = document.getElementById("btnBulkUpload");
    if (bulkFile && bulkFileName && btnBulkUpload) {
      bulkFile.addEventListener("change", () => {
        const f = bulkFile.files?.[0];
        bulkFileName.textContent = f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : "선택된 파일 없음";
        btnBulkUpload.disabled = !f;
      });
      const dropArea = document.getElementById("dropArea");
      ["dragenter", "dragover"].forEach(ev => dropArea?.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add("border-primary");
      }));
      ["dragleave", "drop"].forEach(ev => dropArea?.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove("border-primary");
      }));
      dropArea?.addEventListener("drop", e => {
        const file = e.dataTransfer.files?.[0];
        if (file) {
          const dt = new DataTransfer();
          dt.items.add(file);
          bulkFile.files = dt.files;
          bulkFile.dispatchEvent(new Event("change"));
        }
      });
      btnBulkUpload.addEventListener("click", () => {
        btnBulkUpload.disabled = true;
        btnBulkUpload.textContent = "업로드 중...";
        setTimeout(() => {
          btnBulkUpload.textContent = "업로드";
          alert("업로드가 완료되었습니다. (데모)");
          hideModalById("modalBulkUpload");
        }, 900);
      });
  
      const csvSample = `email,name,password,type,group
  user1@example.com,홍길동,Password1!,member,VIP
  user2@example.com,김영희,Password1!,member,
  manager@example.com,관리자,Admin123!,manager,관리자`;
      function downloadSampleCSV() {
        const blob = new Blob([csvSample], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "user_import_sample.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      document.getElementById("downloadSample")?.addEventListener("click", e => {
        e.preventDefault();
        downloadSampleCSV();
      });
      document.getElementById("downloadSample2")?.addEventListener("click", e => {
        e.preventDefault();
        downloadSampleCSV();
      });
  
      document.getElementById("openTypeCodes")?.addEventListener("click", e => {
        e.preventDefault();
        alert("가입유형 코드: member(일반회원), manager(관리자)");
      });
    }
  
    // --- 사용자 추가 페이지(아바타 프리뷰) ---
    const avatarInput = document.getElementById("avatarInput");
    const avatarPreview = document.getElementById("avatarPreview");
    if (avatarInput && avatarPreview) {
      avatarInput.addEventListener("change", () => {
        const f = avatarInput.files?.[0];
        if (f) {
          const reader = new FileReader();
          reader.onload = () => {
            avatarPreview.src = reader.result;
          };
          reader.readAsDataURL(f);
        }
      });
    }

    refreshMemberInsights();
  })();
  
