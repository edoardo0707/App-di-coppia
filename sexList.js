if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registrato con successo: ', registration);
      })
      .catch((error) => {
        console.log('Errore nella registrazione del Service Worker: ', error);
      });
  });
}

document.getElementById("send-button").addEventListener("mouseup", function() {
      this.blur();
    });
    document.getElementById("send-button").addEventListener("mousedown", function() {
      this.blur();
    });

function aggiornaIdeaDelGiorno() {
    const idee = [
      "💡 Provate la doccia insieme domani mattina 🌧️💋",
      "💡 Scrivetevi una lettera d'amore ✉️❤️",
      "💡 Cucinate qualcosa di nuovo insieme 🍝👩‍🍳",
      "💡 Guardate il tramonto mano nella mano 🌅🤝",
      "💡 Spegnete i telefoni per un'ora solo per voi 📵💑",
      "💡 Fate una passeggiata senza meta 🚶‍♂️🚶‍♀️",
      "💡 Raccontatevi un segreto mai detto 🤫💞"
    ];

    // Usa il giorno corrente per selezionare un'idea
    const oggi = new Date();
    const indice = oggi.getDate() % idee.length;

    // Aggiorna il contenuto della div
    const dailyTip = document.querySelector('.daily-tip');
    if (dailyTip) {
      dailyTip.textContent = idee[indice];
    }
  }
  document.addEventListener('DOMContentLoaded', aggiornaIdeaDelGiorno);

  document.addEventListener("DOMContentLoaded", function() {
  const profileImageCircle = document.getElementById("profileImageCircle");
  const profileImageInput = document.getElementById("profileImageInput");

  // Carica immagine da localStorage se presente
  const savedImg = localStorage.getItem("profileImage");
  if (savedImg && profileImageCircle) {
    profileImageCircle.style.backgroundImage = `url(${savedImg})`;
  }

  if (profileImageCircle && profileImageInput) {
    profileImageCircle.onclick = () => profileImageInput.click();
    profileImageInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imgSrc = ev.target.result;
        profileImageCircle.style.backgroundImage = `url(${imgSrc})`;
        localStorage.setItem("profileImage", imgSrc);
      };
      reader.readAsDataURL(file);
    };
  }
  const usernameInput = document.getElementById("username-input");
  const usernameError = document.getElementById("username-error");
  let partnerName = "";

  // UID e roomId
  let myUid = localStorage.getItem("myUid");
  if (!myUid) {
    myUid = Math.random().toString(36).substring(2, 12);
    localStorage.setItem("myUid", myUid);
  }
  // Recupera roomId dalla URL o variabile globale
  let roomId = window.roomId || (new URLSearchParams(window.location.search)).get("room");

  // Aggiorna nome su Firestore quando cambia
  usernameInput.addEventListener("input", function() {
    const myName = this.value.trim();
    saveMyNameToFirestore(roomId, myUid, myName);
    // Mostra errore se uguale al partner
    if (partnerName && myName.toLowerCase() === partnerName.toLowerCase()) {
      usernameError.textContent = "Il nome non può essere uguale a quello del partner!";
      usernameError.style.display = "block";
    } else {
      usernameError.textContent = "";
      usernameError.style.display = "none";
    }
    localStorage.setItem("chatName", myName);
  });

  // Ascolta il nome del partner
  listenToPartnerName(roomId, myUid, function(newPartnerName) {
    partnerName = newPartnerName;
    // Forza il controllo errore
    usernameInput.dispatchEvent(new Event('input'));
  });

  // All'avvio, se c'è già un nome salvato, lo mostra
  let myName = localStorage.getItem("chatName") || "";
  if (usernameInput) usernameInput.value = myName;
});


async function saveMyNameToFirestore(roomId, myUid, myName) {
  if (!roomId) return; // <-- aggiungi questo controllo
  const roomRef = firebase.firestore().collection("rooms").doc(roomId);
  await roomRef.set({
    userNames: { [myUid]: myName }
  }, { merge: true });
}

// Ascolta i nomi degli utenti nella stanza
function listenToPartnerName(roomId, myUid, onPartnerName) {
  const roomRef = firebase.firestore().collection("rooms").doc(roomId);
  return roomRef.onSnapshot(doc => {
    const data = doc.data();
    if (data && data.userNames) {
      // Prendi il nome partner (diverso dal mio UID)
      const partnerUid = Object.keys(data.userNames).find(uid => uid !== myUid);
      const partnerName = partnerUid ? data.userNames[partnerUid] : "";
      onPartnerName(partnerName || "");
    }
  });
}
  
  

function initChat() {
  const messagesRef = window.roomDataRef.collection("messages");
  let myName = localStorage.getItem("chatName") || "";
  const usernameInput = document.getElementById("username-input");
  if (usernameInput) {
    usernameInput.value = myName;
    usernameInput.addEventListener("input", function() {
      myName = this.value.trim() || "Anonimo";
      localStorage.setItem("chatName", myName);
    });
  }
  if (!myName) {
    myName = "Anonimo";
  }

  document.getElementById("send-button").addEventListener("click", async () => {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;
    await messagesRef.add({
      name: myName,
      text: text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
  });

  messagesRef.orderBy("timestamp").onSnapshot(snapshot => {
    const container = document.getElementById("chat-container");
    container.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const messageWrapper = document.createElement("div");
      messageWrapper.classList.add("message");
      messageWrapper.classList.add(msg.name === myName ? "me" : "other");
      const textDiv = document.createElement("div");
      textDiv.classList.add("text");
      textDiv.textContent = msg.text;
      const timeDiv = document.createElement("div");
      timeDiv.classList.add("timestamp");
      if (msg.timestamp?.toDate) {
        const date = msg.timestamp.toDate();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        timeDiv.textContent = `${hours}:${minutes}`;
      }
      messageWrapper.appendChild(textDiv);
      messageWrapper.appendChild(timeDiv);
      container.appendChild(messageWrapper);
    });
    container.scrollTop = container.scrollHeight;
  });
}
window.initChat = initChat;

const taskListDiv = document.getElementById('taskList');
const input = document.getElementById('newTask');
let tasksRef;
let citiesRef;
let calendarRef;
let dailyIdeasRef;

// Queste referenze vengono aggiornate quando roomDataRef è pronto
function updateRefs() {
  if (!window.roomDataRef) return;
  tasksRef = roomDataRef.collection("tasks");
  citiesRef = roomDataRef.collection("cities");
  calendarRef = roomDataRef.collection("calendarDays");
  dailyIdeasRef = roomDataRef.collection("dailyIdeas");
}

// --- TASKS ---
function loadTasks() {
  updateRefs();
  if (!tasksRef) return;
  tasksRef.orderBy("text").onSnapshot(snapshot => {
    taskListDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const task = doc.data();
      const taskWrapper = document.createElement('div');
      taskWrapper.className = 'task-wrapper';

      const label = document.createElement('label');
      label.setAttribute('data-docid', doc.id);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.onchange = () => toggleTask(doc.id, task.done);

      const span = document.createElement('span');
      span.textContent = task.text;
      if (task.done) span.classList.add('done');

      label.appendChild(checkbox);
      label.appendChild(span);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Elimina';
      deleteBtn.className = 'delete-btn';
      deleteBtn.style.display = 'none';

      deleteBtn.onclick = () => {
        tasksRef.doc(doc.id).delete();
      };

      taskWrapper.appendChild(label);
      taskWrapper.appendChild(deleteBtn);
      taskListDiv.appendChild(taskWrapper);

      // Swipe/drag events come prima...
      let startX = 0, currentX = 0, swiping = false;
      function showDelete(show) {
        if (show) {
          label.style.transition = 'transform 0.3s ease';
          label.style.transform = 'translateX(-80px)';
          deleteBtn.style.display = 'block';
        } else {
          label.style.transition = 'transform 0.3s ease';
          label.style.transform = 'translateX(0)';
          deleteBtn.style.display = 'none';
        }
      }
      label.addEventListener('touchstart', e => { startX = e.touches[0].clientX; swiping = true; label.style.transition = ''; });
      label.addEventListener('touchmove', e => { if (!swiping) return; currentX = e.touches[0].clientX; let deltaX = currentX - startX; if (deltaX < 0) { deltaX = Math.max(deltaX, -80); label.style.transform = `translateX(${deltaX}px)`; } });
      label.addEventListener('touchend', e => { if (!swiping) return; swiping = false; let deltaX = currentX - startX; if (deltaX < -40) { showDelete(true); } else { showDelete(false); } });
      label.addEventListener('mousedown', e => { startX = e.clientX; swiping = true; label.style.transition = ''; e.preventDefault(); });
      label.addEventListener('mousemove', e => { if (!swiping) return; currentX = e.clientX; let deltaX = currentX - startX; if (deltaX < 0) { deltaX = Math.max(deltaX, -80); label.style.transform = `translateX(${deltaX}px)`; } });
      label.addEventListener('mouseup', e => { if (!swiping) return; swiping = false; let deltaX = currentX - startX; if (deltaX < -40) { showDelete(true); } else { showDelete(false); } });
      label.addEventListener('mouseleave', e => { if (!swiping) return; swiping = false; let deltaX = currentX - startX; if (deltaX < -40) { showDelete(true); } else { showDelete(false); } });
      document.body.addEventListener('click', e => { if (!taskWrapper.contains(e.target)) { showDelete(false); } });
    });
  });
}

function addTask() {
  updateRefs();
  if (!tasksRef) return;
  const text = input.value.trim();
  if (!text) return;
  tasksRef.add({
    text: text,
    done: false,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    input.value = '';
  });
}

function toggleTask(id, currentDoneStatus) {
  updateRefs();
  if (!tasksRef) return;
  tasksRef.doc(id).update({
    done: !currentDoneStatus
  });
}

// --- MENU ---
function toggleMenu() {
  const menu = document.getElementById('slideMenu');
  menu.classList.toggle('show');
}

// --- LOADER ---
window.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("loaderVideo");
  if (video) video.playbackRate = 2.0;
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.transition = "opacity 0.5s ease";
      loader.style.opacity = "0";
      setTimeout(() => { loader.remove(); }, 500);
    }
  }, 4000);
});

// --- CONTAINER SWITCH ---
function toggleContainer(id) {
  const container3 = document.getElementById('container3');
  const target = document.getElementById(id);
  const allSections = document.querySelectorAll('.section');
  if (!container3 || !target) return;
  const isTargetVisible = !target.classList.contains('hidden');
  allSections.forEach(section => section.classList.add('hidden'));
  if (!isTargetVisible) {
    target.classList.remove('hidden');
    container3.style.display = 'none';
  } else {
    container3.style.display = 'flex';
  }
  const visibleSections = Array.from(allSections).filter(section => section.id !== 'container3' && !section.classList.contains('hidden'));
  if (visibleSections.length > 0) {
    container3.style.display = 'none';
  } else {
    container3.style.display = 'flex';
  }
  const menu = document.querySelector('.slide-menu');
  if (menu?.classList.contains('show')) {
    menu.classList.remove('show');
  }
}

// --- CITIES ---
const cities = [];
function loadCities() {
  updateRefs();
  if (!citiesRef) return;
  citiesRef.onSnapshot(snapshot => {
    cities.length = 0;
    snapshot.forEach(doc => {
      const city = doc.data();
      city.docId = doc.id;
      cities.push(city);
    });
    globe.pointsData(cities);
    updateCityList();
  });
}

const globe = Globe()
  .globeImageUrl('world.topo.bathy.200412.3x5400x2700.jpg')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .pointsData(cities)
  .pointLat(d => d.lat)
  .pointLng(d => d.lng)
  .pointColor(() => 'red')
  .pointAltitude(0.02)
  .pointRadius(0.4)
  .pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000)
  .onPointClick(point => {
    globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 0.7 }, 1000);
  });

globe(document.getElementById('globeViz'));

const cityListDiv = document.getElementById('cityList');
function updateCityList() {
  cityListDiv.innerHTML = '';
  cities.forEach((city) => {
    const span = document.createElement('span');
    span.textContent = city.name;
    span.title = `Clicca per zoomare su ${city.name}`;
    span.onclick = () => {
      globe.pointOfView({ lat: city.lat, lng: city.lng, altitude: 0.7 }, 1000);
      const mapUrl = `https://maps.google.com/maps?q=${city.lat},${city.lng}&z=14&output=embed`;
      document.getElementById('mapFrame').src = mapUrl;
    };
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.style.marginLeft = '8px';
    removeBtn.style.background = 'transparent';
    removeBtn.style.border = 'none';
    removeBtn.style.color = 'white';
    removeBtn.style.cursor = 'pointer';
    removeBtn.title = 'Rimuovi';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeCity(city.docId);
    };
    span.appendChild(removeBtn);
    cityListDiv.appendChild(span);
  });
}

function removeCity(docId) {
  updateRefs();
  if (!citiesRef) return;
  const index = cities.findIndex(c => c.docId === docId);
  if (index !== -1) {
    cities.splice(index, 1);
    globe.pointsData(cities);
    updateCityList();
    citiesRef.doc(docId).delete()
      .then(() => { console.log(`Città ${docId} rimossa da Firestore.`); })
      .catch(error => { console.error('Errore durante la rimozione da Firestore:', error); });
  }
}

function saveCityToFirestore(city) {
  updateRefs();
  if (!citiesRef) return;
  const cityId = city.name.toLowerCase().replace(/\s+/g, '_');
  citiesRef.doc(cityId).set(city)
    .then(() => { console.log('Città salvata:', city.name); })
    .catch(error => { console.error('Errore salvataggio città:', error); });
}

async function geocodeCity(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Errore nella richiesta di geocoding');
  const results = await response.json();
  if (results.length === 0) return null;
  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    name: cityName
  };
}

const input2 = document.getElementById('cityInput');
input2.addEventListener('keydown', async e => {
  if (e.key === 'Enter' && input2.value.trim() !== '') {
    const cityName = input2.value.trim();
    input2.disabled = true;
    const city = await geocodeCity(cityName);
    input2.disabled = false;
    if (city) {
      if (!cities.some(c => c.name.toLowerCase() === city.name.toLowerCase())) {
        cities.push(city);
        globe.pointsData(cities);
        updateCityList();
        globe.pointOfView({ lat: city.lat, lng: city.lng, altitude: 0.7 }, 1000);
        saveCityToFirestore(city);
      } else {
        alert('Questa città è già stata aggiunta.');
      }
      input2.value = '';
    } else {
      alert('Città non trovata');
    }
  }
});

// --- TASK CARDS ORIZZONTALI ---
function renderHorizontalTaskCards() {
  updateRefs();
  if (!tasksRef) return;
  const container = document.getElementById("taskCardContainer");
  if (!container) return;
  tasksRef.where("done", "==", false).orderBy("text").onSnapshot(snapshot => {
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const task = doc.data();
      const card = document.createElement("div");
      card.className = "card";
      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = task.text;
      card.appendChild(title);
      container.appendChild(card);
    });
  });
}

// --- CALENDARIO ---
const daysContainer = document.getElementById('days');
const monthYear = document.getElementById('monthYear');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const detailBox = document.getElementById('dayDetail');
let currentDate = new Date();
const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
let dayContents = {};

function formatDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

async function saveDayContent(key, content) {
  updateRefs();
  if (!calendarRef) return;
  try {
    await calendarRef.doc(key).set(content);
    dayContents[key] = content;
    console.log("Salvato:", key, content);
  } catch (e) {
    console.error("Errore salvataggio Firestore:", e);
  }
}

async function loadDayContent(key) {
  updateRefs();
  if (!calendarRef) return {};
  try {
    const doc = await calendarRef.doc(key).get();
    if (doc.exists) {
      dayContents[key] = doc.data();
      return doc.data();
    }
    return {};
  } catch (e) {
    console.error("Errore caricamento Firestore:", e);
    return {};
  }
}

async function loadMonthContents(year, month) {
  dayContents = {};
  updateRefs();
  if (!calendarRef) return;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const promises = [];
  for(let day = 1; day <= lastDate; day++) {
    const key = formatDateKey(new Date(year, month, day));
    promises.push(loadDayContent(key));
  }
  await Promise.all(promises);
}

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  monthYear.textContent = `${monthNames[month]} ${year}`;
  daysContainer.innerHTML = '';
  detailBox.classList.add('hidden');
  for(let i=0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('empty');
    daysContainer.appendChild(empty);
  }
  for(let i = 1; i <= lastDate; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.textContent = i;
    dayDiv.classList.add('day');
    if(i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayDiv.classList.add('today');
    }
    const key = formatDateKey(new Date(year, month, i));
    const contentObj = dayContents[key] || {};
    if(contentObj.bgImage) {
      dayDiv.style.backgroundImage = `url(${contentObj.bgImage})`;
      dayDiv.style.backgroundSize = 'cover';
      dayDiv.style.backgroundPosition = 'center';
      dayDiv.style.color = 'white';
      dayDiv.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';
    }
    if(contentObj.icons?.[0]) {
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = '🔥';
      emojiSpan.classList.add('icon-emoji');
      dayDiv.appendChild(emojiSpan);
    }
    dayDiv.onclick = () => openDayDetail(year, month, i);
    daysContainer.appendChild(dayDiv);
  }
}

async function openDayDetail(year, month, day) {
  const key = formatDateKey(new Date(year, month, day));
  const contentObj = await loadDayContent(key);
  detailBox.innerHTML = `
    <button id="closeDetail">✖</button>
    <div class="image-upload">
      <div class="image-circle" id="imageCircle"></div>
      <input type="file" id="imageInput" accept="image/*" style="display:none"/>
    </div>
    <div class="input-group">
      <label>Descrizione</label>
      <textarea id="descInput" placeholder="Aggiungi descrizione..." style="color: #000000;">${contentObj.description || ''}</textarea>
    </div>
    <div class="input-group">
      <label>Promemoria</label>
      <textarea id="reminderInput" placeholder="Aggiungi promemoria..." style="color:rgb(0, 0, 0);">${contentObj.reminder || ''}</textarea>
    </div>
    <div class="icon-checkboxes" style="color:rgb(255, 255, 255);">
      <label><input type="checkbox" id="icon0" ${contentObj.icons?.[0] ? 'checked' : ''}>sex</label>
      <label><input type="checkbox" id="icon1" ${contentObj.icons?.[1] ? 'checked' : ''}>bocchino</label>
      <label><input type="checkbox" id="icon2" ${contentObj.icons?.[2] ? 'checked' : ''}>ditalino</label>
      <label><input type="checkbox" id="icon3" ${contentObj.icons?.[3] ? 'checked' : ''}>sega</label>
      <label><input type="checkbox" id="icon4" ${contentObj.icons?.[4] ? 'checked' : ''}>leccata</label>
      <label><input type="checkbox" id="icon5" ${contentObj.icons?.[5] ? 'checked' : ''}>anale</label>
    </div>
  `;
  detailBox.classList.remove('hidden');
  if(contentObj.bgImage) {
    updateCircleBackground(contentObj.bgImage);
    updateDayDetailBackground(contentObj.bgImage);
  } else {
    detailBox.style.backgroundImage = '';
    const circle = detailBox.querySelector('.image-circle');
    if(circle) circle.style.backgroundImage = '';
  }
  document.getElementById('closeDetail').onclick = () => detailBox.classList.add('hidden');
  const imageCircle = detailBox.querySelector('.image-circle');
  const imageInput = detailBox.querySelector('#imageInput');
  imageCircle.onclick = () => imageInput.click();
  imageInput.onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgSrc = ev.target.result;
      setBackgroundForDay(year, month, day, imgSrc);
      updateDayContent(key, { bgImage: imgSrc });
    };
    reader.readAsDataURL(file);
  };
  const descInput = detailBox.querySelector('#descInput');
  const reminderInput = detailBox.querySelector('#reminderInput');
  const iconCheckboxes = [];
  for(let i=0; i<6; i++) {
    iconCheckboxes[i] = detailBox.querySelector(`#icon${i}`);
    iconCheckboxes[i].addEventListener('change', saveInputs);
  }
  descInput.addEventListener('input', saveInputs);
  reminderInput.addEventListener('input', saveInputs);
  function saveInputs() {
    const newContent = {
      description: descInput.value,
      reminder: reminderInput.value,
      icons: iconCheckboxes.map(cb => cb.checked),
      bgImage: dayContents[key]?.bgImage || null
    };
    updateDayContent(key, newContent);
  }
}

function updateDayContent(key, newContent) {
  dayContents[key] = { ...(dayContents[key] || {}), ...newContent };
  saveDayContent(key, dayContents[key]);
}

function setBackgroundForDay(year, month, day, imgSrc) {
  const key = formatDateKey(new Date(year, month, day));
  if(!dayContents[key]) dayContents[key] = {};
  dayContents[key].bgImage = imgSrc;
  const allDays = daysContainer.querySelectorAll('div.day');
  allDays.forEach(div => {
    if(+div.textContent === day && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
      div.style.backgroundImage = `url(${imgSrc})`;
      div.style.backgroundSize = 'cover';
      div.style.backgroundPosition = 'center';
      div.style.color = 'white';
      div.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';
    }
  });
  updateDayDetailBackground(imgSrc);
}

function updateDayDetailBackground(imgSrc) {
  detailBox.style.backgroundImage = `
    linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgb(0, 0, 0) 90%),
    url(${imgSrc})
  `;
  detailBox.style.backgroundSize = 'cover';
  detailBox.style.backgroundPosition = 'center';
}

function updateCircleBackground(imgSrc) {
  const circle = detailBox.querySelector('.image-circle');
  if(circle) {
    circle.style.backgroundImage = `url(${imgSrc})`;
    circle.style.backgroundSize = 'cover';
    circle.style.backgroundPosition = 'center';
    circle.style.border = '2px solid #ccc';
  }
}

async function renderMonthWithData(date) {
  await loadMonthContents(date.getFullYear(), date.getMonth());
  renderCalendar(date);
}

prevBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderMonthWithData(currentDate);
};
nextBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderMonthWithData(currentDate);
};

// --- DAILY IDEA (stub, puoi personalizzare) ---
function loadDailyIdea() {
  // Qui puoi aggiungere la logica per dailyIdeasRef
}

// --- INIZIALIZZAZIONE ---
window.loadTasks = loadTasks;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.toggleMenu = toggleMenu;
window.toggleContainer = toggleContainer;
window.loadCities = loadCities;
window.loadCalendar = () => renderMonthWithData(currentDate);
window.loadDailyIdea = loadDailyIdea;
