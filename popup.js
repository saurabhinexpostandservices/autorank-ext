const input = document.getElementById("siteInput");
const list = document.getElementById("list");
const saveBtn = document.getElementById("saveBtn");

function render(website) {
    if (!website) {
        list.innerHTML = "";
        input.style.display = "block";
        saveBtn.style.display = "block";
        return;
    }

    list.innerHTML = `
    <div class="card">
      <span>${website}</span>
      <div>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    </div>
  `;

    input.style.display = "none";
    saveBtn.style.display = "none";

    document.querySelector(".edit").onclick = () => {
        input.value = website;
        input.style.display = "block";
        saveBtn.style.display = "block";
        list.innerHTML = "";
    };

    document.querySelector(".delete").onclick = () => {
        chrome.storage.local.remove("website", load);
    };
}

function load() {
    chrome.storage.local.get("website", ({ website }) => {
        render(website);
    });
}

saveBtn.onclick = () => {
    const value = input.value.trim();
    if (!value) return alert("Enter website");
    chrome.storage.local.set({ website: value }, load);
};

document.addEventListener("DOMContentLoaded", load);
