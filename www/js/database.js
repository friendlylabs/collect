class Database {
    constructor(databaseName, tables) {
        if (!databaseName) {
            return;
        }

        if (!Database.instance) {
            this.db = new Dexie(databaseName);
            this.db.version(1).stores(tables);

            // Set hooks for created_at and updated_at
            this.setupHooks();
            Database.instance = this;
        }
        return Database.instance;
    }

    getDB() {
        return this.db;
    }

    setupHooks() {
        // Auto-set timestamps on creation
        this.db.forms.hook("creating", (primKey, obj) => {
            obj.created_at = obj.created_at || new Date().toISOString();
            obj.updated_at = obj.updated_at || new Date().toISOString();
        });

        this.db.forms.hook("updating", (modifications, primKey, obj) => {
            modifications.updated_at = new Date().toISOString();
            return modifications;
        });

        this.db.submissions.hook("creating", (primKey, obj) => {
            obj.created_at = obj.created_at || new Date().toISOString();
        });

        this.db.zones.hook("creating", (primKey, obj) => {
            obj.created_at = obj.created_at || new Date().toISOString();
            obj.updated_at = obj.updated_at || new Date().toISOString();
        });

        this.db.zones.hook("updating", (modifications, primKey, obj) => {
            modifications.updated_at = new Date().toISOString();
            return modifications;
        });
    }
}

/**
 * Initialize the database
 * 
 * @param {string} databaseName 
 * @param {object} tables 
 * 
 * @returns {Database}
 */
let databaseName = localStorage.getItem('project') ?? null;
const dbInstance = new Database(databaseName, {
    forms: "id, title, content, theme, created_at, updated_at",
    submissions: "++id, form_id, content, created_at",
    zones: "code, name, content, created_at, updated_at"
}).getDB();


/**
 * Add forms to the database
 * 
 * @param {Array} forms
 * @returns {boolean}
 */
async function addForms(forms) {
    try {
        await dbInstance.forms.bulkPut(forms);
        toast.success({message: "Forms added successfully!"});
        return true;
    } catch (error) {
        toast.error({message: "Error adding forms!"});
        console.error("Error adding forms:", error);
        return false;
    }
}

/**
 * Get all forms from the database
 * 
 * @returns {Array}
 */
async function getForms() {
    try {
        const forms = await dbInstance.forms.toArray();
        return forms;
    } catch (error) {
        console.error("Error fetching forms:", error);
        return [];
    }
}


/**
 * Get forms from the database
 * 
 * @param {string} projectId
 * @returns {Array}
 * 
 */
async function getFormById(formId) {
    try {
        const form = await dbInstance.forms.where("id").equals(formId).first();
        return form;
    } catch (error) {
        console.error("Error fetching form:", error);
        return null;
    }
}

/**
 * Delete a form from the database
 * 
 * @param {string} formId
 * @returns {boolean}
 */
async function deleteForm(formId) {
    try {
        const deleted = await dbInstance.forms.delete(formId);
        return true;
    } catch (error) {
        console.error("Error deleting form:", error);
        return false;
    }
}

/**
 * Add submission to the database
 * 
 * @param {Array} submission
 * @returns {boolean}
 */
async function addSubmission(submission) {
    try {
        await dbInstance.submissions.add(submission);
        return true;
    } catch (error) {
        console.error("Error adding submission:", error);
        return false;
    }
}

/**
 * Get form submissions
 * 
 * @param {string} formId
 * @returns {Array}
 */
async function getSubmissionsByFormId(formId) {
    try {
        const submissions = await dbInstance.submissions.where("form_id").equals(formId).toArray();
        return submissions;
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return []; // Return an empty array if no submissions are found
    }
}

/**
 * Clear form submissions
 * 
 * @param {string} formId
 * @returns {boolean}
 */
async function clearSubmissionsByFormId(formId) {
    try {
        await dbInstance.submissions.where("form_id").equals(formId).delete();
        return true;
    } catch (error) {
        console.error("Error clearing submissions:", error);
        return false;
    }
}

/**
 * Count all form submissions
 * 
 * @returns {number}
 */
async function countSubmissions() {
    try {
        const count = await dbInstance.submissions.count();
        return count;
    } catch (error) {
        console.error("Error counting submissions:", error);
        return 0;
    }
}

/**
 * Count form submissions
 * 
 * @param {string} formId
 * @returns {number}
 */
async function countSubmissionsByFormId(formId) {
    try {
        const count = await dbInstance.submissions.where("form_id").equals(formId).count();
        return count;
    } catch (error) {
        console.error("Error counting submissions:", error);
        return 0;
    }
}

/**
 * Add zones to the database
 * 
 * @param {Array} zones
 * @returns {boolean}
 */
async function addZones(zones) {
    try {
        await dbInstance.zones.bulkPut(zones);
        return true;
    } catch (error) {
        console.error("Error adding zones:", error);
        return false;
    }
}

/**
 * Get all zones from the database
 * 
 * @returns {Array}
 */
async function getZones() {
    try {
        const zones = await dbInstance.zones.toArray();
        return zones;
    } catch (error) {
        console.error("Error fetching zones:", error);
        return [];
    }
}

/**
 * Get zone by code from the database
 * 
 * @param {string} code
 * @returns {Object|null}
 */
async function getZoneByCode(code) {
    try {
        const zone = await dbInstance.zones.where("code").equals(code).first();
        return zone;
    } catch (error) {
        console.error("Error fetching zone:", error);
        return null;
    }
}

/**
 * Delete a zone from the database
 * 
 * @param {string} code
 * @returns {boolean}
 */
async function deleteZone(code) {
    try {
        await dbInstance.zones.where("code").equals(code).delete();
        return true;
    } catch (error) {
        console.error("Error deleting zone:", error);
        return false;
    }
}

/**
 * Clear all zones from the database
 * 
 * @returns {boolean}
 */
async function clearZones() {
    try {
        await dbInstance.zones.clear();
        return true;
    } catch (error) {
        console.error("Error clearing zones:", error);
        return false;
    }
}