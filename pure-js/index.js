let db;

function createDB(name, version) {
  console.log("Creating DB", { name, version });
  const request = indexedDB.open(name, version);

  request.onupgradeneeded = function (event) {
    db = event.target.result;

    const personalNotes = db.createObjectStore("personal_notes", {
      keyPath: "title",
    });

    const todoTotes = db.createObjectStore("todo_notes", { keyPath: "title" });

    console.log("Upgrade needed", db);
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("onSuccess", db);
  };

  request.onerror = function (event) {
    console.log("onError");
  };
}

const btnCreateDB = document.getElementById("dbCreate");
const btnAddNote = document.getElementById("addNote");
const btnViewNotes = document.getElementById("viewNotes");

btnViewNotes.addEventListener("click", () => {
  const tx = db.transaction("personal_notes", "readonly");
  const store = tx.objectStore("personal_notes");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      console.log(cursor.value);
      cursor.continue();
    } else {
      console.log("No more notes");
    }
  };
});

btnAddNote.addEventListener("click", () => {
  const note = {
    title: "note1",
    text: "This is my note",
  };

  const tx = db.transaction("personal_notes", "readwrite");
  tx.onerror = (e) => {
    console.log(e.target.error);
  };
  tx.objectStore("personal_notes").add(note);
});

btnCreateDB.addEventListener("click", () => {
  const dbName = document.getElementById("dbName").value;
  const dbVersion = Number(document.getElementById("dbVersion").value);

  createDB(dbName, dbVersion);
});
