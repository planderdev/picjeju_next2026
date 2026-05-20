document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("pointTransferForm");
    const inputPoint = form.querySelector("input[type='number']");
    const inputReason = form.querySelector("input[type='text']");
    const selectedMembers = document.getElementById("selectedMembers");

    const modalEl = document.getElementById("pointResultModal");
    const modalMsg = document.getElementById("pointResultMessage");
    const modal = picjejuUI.Modal.getOrCreateInstance(modalEl);

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const sendPoint = Number(inputPoint.value);
        const reason    = inputReason.value.trim();
        const members   = selectedMembers.querySelectorAll(".member-item");

        // 입력 체크
        if (!sendPoint || sendPoint <= 0) {
            alert("전송할 포인트를 입력해주세요.");
            return;
        }
        if (!reason) {
            alert("사유/내용을 입력해주세요.");
            return;
        }
        if (!members.length) {
            alert("전송 대상을 선택해주세요.");
            return;
        }

        // 예시 값: window.myPoint (보유 포인트)
        const myPoint = Number(window.myPoint ?? 0);

        if (sendPoint > myPoint) {
            // ❌ 포인트 부족
            modalMsg.textContent = "포인트가 충분하지 않습니다.";
            modal.show();
            return;
        }

        // 정상 (전송)
        modalMsg.textContent = "포인트 전송이 완료되었습니다.";
        modal.show();

        // 폼 초기화
        inputPoint.value = "";
        inputReason.value = "";
        selectedMembers.innerHTML = "";

        // 사용 포인트 감소 (예시)
        window.myPoint = myPoint - sendPoint;
        console.log("남은 포인트:", window.myPoint);
    });
});
