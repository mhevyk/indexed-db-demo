class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseError";
  }
}

class Collection {
  constructor(name, store) {
    this.name = name;
    this.store = store;
  }

  add(data) {
    return new Promise((resolve, reject) => {
      const request = this.store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        if (event.target.error.name === "ConstraintError") {
          return reject(new DatabaseError("Data already exists in collection"));
        }

        reject(
          new DatabaseError(`Failed to add data to collection ${this.name}`)
        );
      };
    });
  }

  get(id) {
    return new Promise((resolve, reject) => {
      const request = this.store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new DatabaseError(`Failed to get data from collection ${this.name}`)
        );
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      const request = this.store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new DatabaseError(`Failed to get data from collection ${this.name}`)
        );
    });
  }

  update(id, data) {
    return new Promise((resolve, reject) => {
      const request = this.store.put(data, id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new DatabaseError(`Failed to update data in collection ${this.name}`)
        );
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      const request = this.store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          new DatabaseError(
            `Failed to delete data from collection ${this.name}`
          )
        );
    });
  }
}

class Database {
  constructor(dbName, version = 1) {
    this.db = null;
    this.dbName = dbName;
    this.version = version;
  }

  initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        this.db = db;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(new DatabaseError(`Failed to open database ${this.dbName}`));
      };
    });
  }

  getDb() {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return this.initialize();
  }

  addCollection(collectionName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version + 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(collectionName)) {
          db.createObjectStore(collectionName, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.version++;
        resolve();
      };

      request.onerror = () => {
        reject(new DatabaseError(`Failed to add collection ${collectionName}`));
      };
    });
  }

  async getCollection(collectionName) {
    const db = await this.getDb();

    if (!db.objectStoreNames.contains(collectionName)) {
      throw new DatabaseError(`Collection ${collectionName} does not exist`);
    }

    const transaction = db.transaction(collectionName, "readwrite");
    const store = transaction.objectStore(collectionName);

    return new Collection(collectionName, store);
  }
}

(async () => {
  const db = new Database("app");

  console.log(db);

  await db.addCollection("todos");

  const todos = await db.getCollection("todos");
  await todos.add({ id: 1, text: "Buy milk" });
  await todos.add({ id: 2, text: "Buy eggs" });
  await todos.add({ id: 3, text: "Buy bread" });
  await todos.add({ id: 4, text: "Buy butter" });

  console.log(await todos.getAll());

  await todos.delete(2);

  console.log(await todos.get(2));
})();
