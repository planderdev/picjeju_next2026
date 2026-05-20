let currentDate = new Date(2025, 9, 1);
let loadedCalendarEvents = null;

function normalizeDate(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function diffInDays(start, end) {
    const day = 24 * 60 * 60 * 1000;
    return Math.round((normalizeDate(end) - normalizeDate(start)) / day);
}

function getCalendarEvents() {
    if (Array.isArray(loadedCalendarEvents)) return loadedCalendarEvents;

    try {
        return Array.isArray(calendarEvents) ? calendarEvents : [];
    } catch (error) {
        return [];
    }
}

function isHoliday(date) {
    const holidays = [
        "01-01",
        "03-01",
        "05-05",
        "06-06",
        "08-15",
        "10-03",
        "10-09",
        "12-25"
    ];

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return holidays.includes(`${month}-${day}`);
}

function buildEventRows(weekDates, events) {
    if (!weekDates.length) return [];

    const weekStart = normalizeDate(weekDates[0].date);
    const weekEnd = normalizeDate(weekDates[6].date);

    const segments = events
        .map((eventItem) => {
            const eventStart = normalizeDate(eventItem.start);
            const eventEnd = normalizeDate(eventItem.end || eventItem.start);

            if (eventEnd < weekStart || eventStart > weekEnd) return null;

            const start = Math.max(0, diffInDays(weekStart, eventStart));
            const end = Math.min(6, diffInDays(weekStart, eventEnd));

            return {
                eventItem,
                start,
                end,
                span: end - start + 1
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            if (a.end !== b.end) return b.end - a.end;
            return String(a.eventItem.title || "").localeCompare(String(b.eventItem.title || ""), "ko");
        });

    return segments.reduce((rows, segment) => {
        const targetRow = rows.find((row) =>
            row.every((placed) => segment.end < placed.start || segment.start > placed.end)
        );

        if (targetRow) {
            targetRow.push(segment);
        } else {
            rows.push([segment]);
        }

        return rows;
    }, []);
}

function createDateCell(dayInfo) {
    const cell = document.createElement("div");
    cell.className = "day";

    const dayOfWeek = dayInfo.date.getDay();
    if (dayOfWeek === 0) cell.classList.add("sunday");
    if (dayOfWeek === 6) cell.classList.add("saturday");
    if (isHoliday(dayInfo.date)) cell.classList.add("holiday");
    if (dayInfo.isOtherMonth) cell.classList.add("other-month");

    const dateEl = document.createElement("div");
    dateEl.className = "date-num";
    dateEl.textContent = dayInfo.dateNum;
    cell.appendChild(dateEl);

    return cell;
}

function createEventButton(segment) {
    const eventItem = segment.eventItem;
    const eventButton = document.createElement("button");
    eventButton.type = "button";
    eventButton.className = `event ${eventItem.cateClass || ""}`.trim();
    eventButton.style.gridColumn = `${segment.start + 1} / span ${segment.span}`;
    eventButton.setAttribute("aria-label", `${eventItem.category || ""} ${eventItem.title || ""}`.trim());

    const category = document.createElement("strong");
    category.textContent = eventItem.category || "";

    const title = document.createElement("span");
    title.className = "event-title";
    title.textContent = eventItem.title || "";

    eventButton.append(category, title);
    eventButton.addEventListener("click", () => {
        if (!eventItem.id) return;

        const target = `single-view.html?id=${eventItem.id}`;
        location.href = window.picjejuPage ? window.picjejuPage(target) : target;
    });

    return eventButton;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const title = document.getElementById("currentMonth");
    const body = document.getElementById("calendarBody");
    const eventLayer = document.getElementById("calendarEvents");

    if (!body) return;

    const yearEl = title ? title.querySelector(".year") : null;
    const monthEl = title ? title.querySelector(".month") : null;

    if (yearEl) yearEl.textContent = `${year}년`;
    if (monthEl) monthEl.textContent = `${month + 1}월`;

    document.querySelectorAll(".calendar-weekdays div").forEach((el, idx) => {
        el.classList.toggle("sunday", idx === 0);
        el.classList.toggle("saturday", idx === 6);
    });

    body.innerHTML = "";
    if (eventLayer) {
        eventLayer.innerHTML = "";
        eventLayer.hidden = true;
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const startOffset = firstDay.getDay();
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
    const events = getCalendarEvents();
    const dates = [];

    for (let index = 0; index < totalCells; index += 1) {
        let dateNum;
        let cellDate;
        let isOtherMonth = false;

        if (index < startOffset) {
            dateNum = prevLastDay.getDate() - startOffset + index + 1;
            cellDate = new Date(year, month - 1, dateNum);
            isOtherMonth = true;
        } else if (index < startOffset + lastDay.getDate()) {
            dateNum = index - startOffset + 1;
            cellDate = new Date(year, month, dateNum);
        } else {
            dateNum = index - (startOffset + lastDay.getDate()) + 1;
            cellDate = new Date(year, month + 1, dateNum);
            isOtherMonth = true;
        }

        cellDate.setHours(0, 0, 0, 0);
        dates.push({ date: cellDate, dateNum, isOtherMonth });
    }

    for (let weekIndex = 0; weekIndex < dates.length; weekIndex += 7) {
        const weekDates = dates.slice(weekIndex, weekIndex + 7);
        const week = document.createElement("div");
        week.className = "calendar-week";

        const dateRow = document.createElement("div");
        dateRow.className = "calendar-date-row";
        weekDates.forEach((dayInfo) => dateRow.appendChild(createDateCell(dayInfo)));
        week.appendChild(dateRow);

        buildEventRows(weekDates, events).forEach((eventRowSegments) => {
            const eventRow = document.createElement("div");
            eventRow.className = "calendar-event-row";
            eventRowSegments.forEach((segment) => eventRow.appendChild(createEventButton(segment)));
            week.appendChild(eventRow);
        });

        body.appendChild(week);
    }
}

const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");

if (prevMonthButton) {
    prevMonthButton.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
}

if (nextMonthButton) {
    nextMonthButton.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

function loadCalendarData(url) {
    return fetch(url)
        .then((res) => res.json())
        .then((data) => {
            loadedCalendarEvents = Array.isArray(data) ? data : [];
            renderCalendar();
            return loadedCalendarEvents;
        })
        .catch((error) => {
            console.error("캘린더 데이터를 불러오지 못했습니다.", error);
            return [];
        });
}

renderCalendar();
