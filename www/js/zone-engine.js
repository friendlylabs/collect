/**
 * Zone Engine - Local data serving engine for offline zone data
 * Mimics the backend API behavior for fetching zone data
 */

class ZoneEngine {
    constructor() {
        this.baseUrlPattern = /\/api\/zones\/show\/([a-f0-9]+)/i;
    }

    /**
     * Parse URL and extract zone code and query parameters
     * 
     * @param {string} url
     * @returns {Object}
     */
    parseUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            
            // Extract zone code from URL
            const match = pathname.match(this.baseUrlPattern);
            if (!match) {
                throw new Error('Invalid zone URL format');
            }
            
            const code = match[1];
            
            // Extract query parameters
            const params = {
                sheet: urlObj.searchParams.get('sheet'),
                search: urlObj.searchParams.get('search'),
                column: urlObj.searchParams.get('column'),
                limit: urlObj.searchParams.get('limit') ? parseInt(urlObj.searchParams.get('limit')) : null,
                offset: urlObj.searchParams.get('offset') ? parseInt(urlObj.searchParams.get('offset')) : 0,
                format: urlObj.searchParams.get('format') || 'json',
                sortBy: urlObj.searchParams.get('sort_by'),
                sortOrder: urlObj.searchParams.get('sort_order') || 'asc',
                distinct: urlObj.searchParams.get('distinct'),
                valueName: urlObj.searchParams.get('valueName'),
                titleName: urlObj.searchParams.get('titleName')
            };
            
            return { code, params };
        } catch (error) {
            console.error('Error parsing URL:', error);
            return null;
        }
    }

    /**
     * Fetch zone data from local storage and apply filters
     * 
     * @param {string} url
     * @param {Object} context - Additional context like valueName, titleName from choicesByUrl
     * @returns {Promise<Array|Object>}
     */
    async fetchZoneData(url, context = {}) {
        const parsed = this.parseUrl(url);
        if (!parsed) {
            throw new Error('Invalid zone URL');
        }

        const { code, params } = parsed;
        
        // Override params with context if provided
        if (context.valueName) params.valueName = context.valueName;
        if (context.titleName) params.titleName = context.titleName;

        // Fetch zone from local database
        const zone = await getZoneByCode(code);
        if (!zone) {
            throw new Error(`Zone ${code} not found in local storage`);
        }

        // Handle different formats
        switch (params.format) {
            case 'summary':
                return this.getDataSummary(zone.content);
            case 'meta':
                return this.getDataMeta(zone.content, params.sheet);
            default:
                return this.processZoneData(zone, params);
        }
    }

    /**
     * Process zone data with filters, sorting, and pagination
     * 
     * @param {Object} zone
     * @param {Object} params
     * @returns {Array|Object}
     */
    processZoneData(zone, params) {
        let data = { ...zone.content };

        // Filter by specific sheet if requested
        if (params.sheet) {
            if (!data[params.sheet]) {
                throw new Error(`Sheet "${params.sheet}" not found in zone`);
            }
            data = { [params.sheet]: data[params.sheet] };
        }

        // Apply search filtering
        if (params.search) {
            data = this.filterDataBySearch(data, params.search, params.column);
        }

        // Apply sorting
        if (params.sortBy) {
            data = this.sortData(data, params.sortBy, params.sortOrder);
        }

        // Handle distinct values request
        if (params.distinct) {
            return this.getDistinctValues(data, params.distinct);
        }

        // Apply pagination
        if (params.limit) {
            data = this.paginateData(data, params.limit, params.offset);
        }

        // Flatten data for SurveyJS (return array of rows)
        return this.flattenForSurveyJS(data, params);
    }

    /**
     * Flatten data for SurveyJS consumption
     * 
     * @param {Object} data
     * @param {Object} params
     * @returns {Array}
     */
    flattenForSurveyJS(data, params) {
        const result = [];
        
        for (const sheetName in data) {
            const sheetData = data[sheetName];
            if (Array.isArray(sheetData)) {
                result.push(...sheetData);
            }
        }

        return result;
    }

    /**
     * Filter data by search term
     * 
     * @param {Object} data
     * @param {string} search
     * @param {string|null} column
     * @returns {Object}
     */
    filterDataBySearch(data, search, column = null) {
        const filtered = {};
        const searchLower = search.toLowerCase();

        for (const sheetName in data) {
            const sheetData = data[sheetName];
            if (!Array.isArray(sheetData) || sheetData.length === 0) continue;

            const filteredRows = [];

            for (const row of sheetData) {
                if (column) {
                    // Search in specific column
                    const value = row[column];
                    if (value && String(value).toLowerCase().includes(searchLower)) {
                        filteredRows.push(row);
                    }
                } else {
                    // Search in all columns
                    let found = false;
                    for (const key in row) {
                        const value = row[key];
                        if (value && String(value).toLowerCase().includes(searchLower)) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        filteredRows.push(row);
                    }
                }
            }

            if (filteredRows.length > 0) {
                filtered[sheetName] = filteredRows;
            }
        }

        return filtered;
    }

    /**
     * Sort data by column
     * 
     * @param {Object} data
     * @param {string} sortBy
     * @param {string} sortOrder
     * @returns {Object}
     */
    sortData(data, sortBy, sortOrder = 'asc') {
        const sorted = {};

        for (const sheetName in data) {
            const sheetData = data[sheetName];
            if (!Array.isArray(sheetData) || sheetData.length === 0) {
                sorted[sheetName] = sheetData;
                continue;
            }

            // Check if sort column exists
            if (!sheetData[0].hasOwnProperty(sortBy)) {
                sorted[sheetName] = sheetData;
                continue;
            }

            const sortedData = [...sheetData].sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];

                // Handle null/undefined
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                // Numeric comparison
                const aNum = Number(aVal);
                const bNum = Number(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortOrder === 'desc' ? bNum - aNum : aNum - bNum;
                }

                // String comparison
                const result = String(aVal).localeCompare(String(bVal));
                return sortOrder === 'desc' ? -result : result;
            });

            sorted[sheetName] = sortedData;
        }

        return sorted;
    }

    /**
     * Paginate data
     * 
     * @param {Object} data
     * @param {number} limit
     * @param {number} offset
     * @returns {Object}
     */
    paginateData(data, limit, offset = 0) {
        const paginated = {};

        for (const sheetName in data) {
            const sheetData = data[sheetName];
            if (!Array.isArray(sheetData)) {
                paginated[sheetName] = sheetData;
                continue;
            }

            paginated[sheetName] = sheetData.slice(offset, offset + limit);
        }

        return paginated;
    }

    /**
     * Get distinct values from a specific column
     * 
     * @param {Object} data
     * @param {string} columnName
     * @returns {Array}
     */
    getDistinctValues(data, columnName) {
        const distinctSet = new Set();
        const result = {};

        for (const sheetName in data) {
            const sheetData = data[sheetName];
            if (!Array.isArray(sheetData) || sheetData.length === 0) continue;

            const sheetDistinct = new Set();

            for (const row of sheetData) {
                if (row.hasOwnProperty(columnName) && row[columnName] != null) {
                    const value = row[columnName];
                    distinctSet.add(value);
                    sheetDistinct.add(value);
                }
            }

            result[sheetName] = Array.from(sheetDistinct).sort();
        }

        // If only one sheet, return flattened array
        if (Object.keys(result).length === 1) {
            return Array.from(distinctSet).sort();
        }

        return {
            all: Array.from(distinctSet).sort(),
            by_sheet: result
        };
    }

    /**
     * Get data summary (metadata about sheets and columns)
     * 
     * @param {Object} content
     * @returns {Object}
     */
    getDataSummary(content) {
        const summary = {
            total_sheets: Object.keys(content).length,
            sheets: {}
        };

        for (const sheetName in content) {
            const sheetData = content[sheetName];
            if (!Array.isArray(sheetData)) continue;

            const rowCount = sheetData.length;
            const columns = rowCount > 0 ? Object.keys(sheetData[0]) : [];

            summary.sheets[sheetName] = {
                row_count: rowCount,
                column_count: columns.length,
                columns: columns
            };
        }

        return summary;
    }

    /**
     * Get metadata about available sheets
     * 
     * @param {Object} content
     * @param {string|null} requestedSheet
     * @returns {Object}
     */
    getDataMeta(content, requestedSheet = null) {
        return {
            available_sheets: Object.keys(content),
            total_sheets: Object.keys(content).length,
            requested_sheet: requestedSheet
        };
    }

    /**
     * Resolve dynamic URLs with variable substitution
     * For example: {country} will be replaced with the value from the survey data
     * 
     * @param {string} url
     * @param {Object} surveyData
     * @returns {string}
     */
    resolveDynamicUrl(url, surveyData = {}) {
        let resolvedUrl = url;
        
        // Find all variables in the URL (e.g., {country}, {region})
        const variables = url.match(/\{([^}]+)\}/g);
        
        if (variables) {
            variables.forEach(variable => {
                const key = variable.slice(1, -1); // Remove { and }
                const value = surveyData[key];
                
                if (value) {
                    resolvedUrl = resolvedUrl.replace(variable, encodeURIComponent(value));
                }
            });
        }
        
        return resolvedUrl;
    }

    /**
     * Extract all zone codes from form content
     * 
     * @param {Object} formContent
     * @returns {Array<string>}
     */
    extractZoneCodes(formContent) {
        const codes = new Set();

        const extractFromElement = (element) => {
            if (element.choicesByUrl && element.choicesByUrl.url) {
                // Extract zone code from URL
                const code = this.getZoneCodeFromUrl(element.choicesByUrl.url);
                if (code) {
                    codes.add(code);
                }
            }

            // Recursively check nested elements
            if (element.elements && Array.isArray(element.elements)) {
                element.elements.forEach(extractFromElement);
            }

            // Check panels
            if (element.panels && Array.isArray(element.panels)) {
                element.panels.forEach(extractFromElement);
            }

            // Check questions in panels
            if (element.questions && Array.isArray(element.questions)) {
                element.questions.forEach(extractFromElement);
            }
        };

        // Parse pages
        if (formContent.pages && Array.isArray(formContent.pages)) {
            formContent.pages.forEach(page => {
                if (page.elements && Array.isArray(page.elements)) {
                    page.elements.forEach(extractFromElement);
                }
            });
        }

        // Also check top-level elements
        if (formContent.elements && Array.isArray(formContent.elements)) {
            formContent.elements.forEach(extractFromElement);
        }

        return Array.from(codes);
    }

    /**
     * Get zone code from URL
     * 
     * @param {string} url
     * @returns {string|null}
     */
    getZoneCodeFromUrl(url) {
        const match = url.match(this.baseUrlPattern);
        return match ? match[1] : null;
    }
}

// Create global instance
const zoneEngine = new ZoneEngine();
