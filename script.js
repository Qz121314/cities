const API_URL = "https://citiesgooglecsv.fcqz121314.workers.dev";
const CACHE_KEY = "cityDataCache";
const CACHE_TIME_KEY = "cacheTimestamp";
const CACHE_DURATION = 600 * 1000;

let allCities = [];
let filteredCities = [];
let currentPage = 1;
let pageSize = 16;

// 动态更新分页数量
function updatePageSize() {
  pageSize = window.innerWidth < 768 ? 6 : 16;
}

// 渲染分页按钮状态
function updatePaginationControls() {
  const totalPages = Math.ceil(filteredCities.length / pageSize);
  const prevBtn = document.querySelector(".pagination button:first-child");
  const nextBtn = document.querySelector(".pagination button:last-child");
  const pageInfo = document.getElementById("pageInfo");

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

// 主渲染函数
function render() {
  updatePageSize();
  const grid = document.getElementById("city-grid");
  const noResult = document.getElementById("no-result-message");
  grid.innerHTML = "";
  noResult.style.display = filteredCities.length === 0 ? "block" : "none";

  const total = filteredCities.length;
  const totalPages = Math.ceil(total / pageSize);
  currentPage = Math.max(1, Math.min(currentPage, totalPages));
  const start = (currentPage - 1) * pageSize;
  const cities = filteredCities.slice(start, start + pageSize);

  cities.forEach((city) => {
    const card = document.createElement("div");
    card.className = "city-card";
    if (city.image_url) {
      card.style.backgroundImage = `url(${city.image_url})`;
    }

    const name = document.createElement("div");
    name.className = "city-name";
    name.textContent = city.name;
    card.appendChild(name);

    if (city.tagline) {
      const tag = document.createElement("div");
      tag.className = "city-tagline";
      tag.textContent = city.tagline;
      card.appendChild(tag);
    }

    if (city.url_slug) {
      card.onclick = () => window.open(city.url_slug, "_blank");
    }

    grid.appendChild(card);
  });

  updatePaginationControls();
}

// 分页按钮
function nextPage() {
  const totalPages = Math.ceil(filteredCities.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    render();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    render();
  }
}

// 搜索
document.getElementById("searchInput").addEventListener("input", function () {
  const keyword = this.value.toLowerCase().trim();
  filteredCities = allCities.filter((c) =>
    c.name.toLowerCase().includes(keyword)
  );
  currentPage = 1;
  render();
});

// 数据缓存加载
function fetchData() {
  const now = Date.now();
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  if (cached && cachedTime && now - cachedTime < CACHE_DURATION) {
    allCities = JSON.parse(cached);
    filteredCities = allCities;
    render();
    return;
  }

  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      allCities = data;
      filteredCities = data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, now);
      render();
    })
    .catch(() => {
      document.getElementById("no-result-message").style.display = "block";
    });
}

// 页面尺寸变化时刷新
window.addEventListener("resize", () => {
  updatePageSize();
  render();
});

fetchData();


