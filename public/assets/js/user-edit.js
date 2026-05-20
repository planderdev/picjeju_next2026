
document.addEventListener("DOMContentLoaded", () => {

    // ============= 프로필 이미지 미리보기 =============
    document.getElementById("btnProfileEdit")?.addEventListener("click", () => {
        document.getElementById("editProfileInput").click();
    });
    
    document.getElementById("editProfileInput")?.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        document.getElementById("editProfilePreview").src = URL.createObjectURL(file);
    });
    
    // ============= 비밀번호 보기/숨기기 =============
    document.querySelectorAll(".pw-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.target);
            const isHidden = target.type === "password";
            target.type = isHidden ? "text" : "password";
            btn.src = isHidden
                ? "../assets/images/svg/icon_eye_on.svg"
                : "../assets/images/svg/icon_eye.svg";
        });
    });
        
    
    // ============= DesignSystem 폼 검증 =============
    const form = document.getElementById("mypageEditForm");
    form.addEventListener("submit", e => {
        e.preventDefault();
        e.stopPropagation();
    
        // 비밀번호 일치 확인
        if (pwNew.value !== pwNewConfirm.value) {
            pwNewConfirm.setCustomValidity("비밀번호 불일치");
        } else {
            pwNewConfirm.setCustomValidity("");
        }
    
        if (form.checkValidity()) {
            alert("회원 정보가 수정되었습니다.");
        }
    
        form.classList.add("was-validated");
    });
    
    
        /* ===============================
            ▣ 회원정보 수정 제출
        ================================ */
        document.getElementById("mypageEditForm").addEventListener("submit", e => {
            e.preventDefault();
    
            // TODO: ajax 전송 가능
            showToast("회원 정보가 수정되었습니다.");
        });
    
    
        /* ===============================
            ▣ 회원탈퇴
        ================================ */
        document.getElementById("btnWithdraw").addEventListener("click", () => {
            if (confirm("정말 회원 탈퇴하시겠습니까?")) {
                // TODO: 탈퇴 API
                alert("회원탈퇴 처리되었습니다.");
            }
        });
    
    });
    
    