const GOOGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7ycQu0OHmf1--bEf7I6U5RnAIZsqM2qmJA-I7k2yrmp6M7iENoZBOFowXW-PXWAZO-wXIKbbRQdkq/pub?output=csv'; 
const CACHE_KEY = "cityDataCache"; // 缓存的键
const CACHE_TIME_KEY = "cacheTimestamp"; // 缓存时间的键
const CACHE_DURATION = 600 * 1000; // 缓存时间：10分钟

let allCities = [];
let filteredCities = [];
let currentPage = 1;
let pageSize = 16;

// 动态更新分页数量
function updatePageSize() {
  pageSize = window.innerWidth < 768 ? 6 : 16; // 如果屏幕宽度小于 768px，分页显示 6 个城市
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
      card.style.backgroundImage = `url(${city.image_url})`;  // 设置背景图片
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

// 获取并缓存 Google 表格数据
function fetchData() {
  const now = Date.now();
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  // 如果缓存存在且没有过期，直接使用缓存的数据
  if (cached && cachedTime && now - cachedTime < CACHE_DURATION) {
    allCities = JSON.parse(cached);
    filteredCities = allCities;
    render();
    return;
  }

  // 如果缓存不存在或已过期，重新获取数据
  fetch(GOOGLE_CSV_URL)
    .then((res) => res.text())  // 获取 CSV 数据
    .then((csvText) => {
      // 解析 CSV 数据
      const rows = csvText.trim().split('\n').slice(1);  // 忽略表头
      allCities = rows.map(row => {
        const [name, url_slug, tagline, image_url] = row.split(',');

        return {
          name: name.trim(),
          url_slug: url_slug.trim(),
          tagline: tagline.trim(),
          image_url: image_url.trim(), // 获取图片 URL
        };
      });
      filteredCities = allCities;

      // 将数据缓存到 localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(allCities));
      localStorage.setItem(CACHE_TIME_KEY, now);
      render();
    })
    .catch((error) => {
      console.error("Error fetching or parsing the Google Sheet:", error);
      document.getElementById("no-result-message").style.display = "block";
    });
}

// 页面尺寸变化时刷新
window.addEventListener("resize", () => {
  updatePageSize();
  render();
});

fetchData();  // 初始数据请求
