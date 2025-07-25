export const QuestTypesList = [
  { type: "radiogroup" },
  { 
    type: "rating",
    variantKey: "rateType",     // Key for rating question variants
    variants: ["default", "stars", "smileys"] 
  },
  { type: "checkbox" },
  { type: "dropdown" },       // some dropdowns have url links to fetch options
                              // i.e {type:dropdown,name:String,choicesByUrl:{url:urlString,path:?String(urlReturnedData[Key]),valueName:?String,titleName:?String(Displayed value, default name)}}
  { type: "tagbox" },
  { type: "boolean" },
  { type: "file" },
  { type: "imagepicker" },
  { type: "ranking" },
  {
    type: "text",
    variantKey: "inputType", // Key for text question variants
    variants: [
      "default",
      "color",
      "date",
      "datetime-local",
      "email",
      "month",
      "number",
      "password",
      "range",
      "tel",
      "time",
      "url",
      "week"
    ]
  },
  { type: "comment" },
  { type: "multipletext" },
  { type: "matrix" },
  { type: "matrixdropdown" },
  { type: "matrixdynamic" },
  { type: "html" },             // HTML content, not a question type
  { type: "panel" },            // Panel for grouping questions, not a question type
  { type: "paneldynamic" },     // Dynamic panels, not a question type
  { type: "expression" },       // Expression question, not a user input type, it displays calculated values
  { type: "image" },
  { type: "signaturepad" },
  {
    type: "geopoint",
    variantKey: "geoFormat",    // Key for geopoint variants
    variants: [
      "default",  // Default geopoint question, gets current location
      "manual",   // Manual entry geopoint question starting with current location
      "trace",    // Geopoint question that allows tracing a path
      "area"      // Geopoint question that allows drawing an area (polygon)
    ]
  },
  { type: "microphone" }
]

export interface ParsedChoice {
  value: string;
  text: string;
  enableIf?: string;
  visibleIf?: string;
  imageLink?: string; // For imagepicker questions
}

export interface ParsedColumn {
  name: string;
  title?: string;
  cellType?: string;
  choices?: ParsedChoice[];
  inputType?: string;
  isRequired?: boolean;
}

export interface ParsedQuestion {
  id: string;
  name: string;
  type: string;
  variant?: string;
  title?: string;
  description?: string;
  isRequired?: boolean;
  choices?: ParsedChoice[];
  columns?: ParsedColumn[];
  rows?: ParsedChoice[];
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  allowedTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  
  // Logic properties
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
  setValueIf?: string;
  setValueExpression?: string;
  defaultValueExpression?: string; // Evaluates expression for default value
  resetValueIf?: string; // Resets value when condition is met
  
  // For matrix questions
  rowCount?: number;
  minRowCount?: number;
  maxRowCount?: number;
  
  // For panels
  elements?: ParsedQuestion[];
  minPanelCount?: number;
  maxPanelCount?: number;
  
  // For image picker
  imageHeight?: number;
  imageWidth?: number;
  multiSelect?: boolean;
  contentMode?: string; // 'image' or 'video' for imagepicker
  imageFit?: string;   // 'cover', 'contain', 'fill', 'scale-down'
  showLabel?: boolean; // Whether to show labels on images
  
  // For image question (preset media)
  imageLink?: string;  // URL for preset media content
  
  // For rating
  rateMin?: number;
  rateMax?: number;
  rateStep?: number;
  rateValues?: ParsedChoice[];
  
  // For HTML/Expression
  html?: string;
  expression?: string;
  
  // For signature pad
  backgroundColor?: string;
  penColor?: string;
  penSize?: number;
  minWidth?: number;
  maxWidth?: number;
  trimWhitespace?: boolean;
  
  // For microphone
  maxDuration?: number; // Maximum recording duration in milliseconds
  
  // Dynamic URLs for choices
  choicesByUrl?: {
    url: string;
    path?: string;
    valueName?: string;
    titleName?: string;
  };
}

export interface ParsedPage {
  id: string;
  name: string;
  title?: string;
  description?: string;
  elements: ParsedQuestion[];
  
  // Page-level logic
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
  
  // Navigation
  navigationButtonsVisibility?: string;
  questionsOrder?: string;
}

export interface ParsedTrigger {
  type: 'complete' | 'setvalue' | 'copyvalue' | 'runexpression' | 'skip';
  expression: string;
  setToName?: string;
  setValue?: any;
  fromName?: string;
  gotoName?: string;
  runExpression?: string;
}

export interface ParsedSurvey {
  id?: string;
  title?: string;
  description?: string;
  pages: ParsedPage[];
  triggers?: ParsedTrigger[];
  
  // Survey-level settings
  showProgressBar?: boolean;
  progressBarType?: string;
  showNavigationButtons?: boolean;
  showTitle?: boolean;
  showPageTitles?: boolean;
  showQuestionNumbers?: string;
  questionErrorLocation?: string;
  focusFirstQuestionAutomatic?: boolean;
  goNextPageAutomatic?: boolean;
  allowCompleteSurveyAutomatic?: boolean;
  
  // Validation
  checkErrorsMode?: string;
  textUpdateMode?: string;
  
  // Completion
  completedHtml?: string;
  loadingHtml?: string;
  
  // Branding
  logo?: string;
  logoPosition?: string;
  logoWidth?: number;
  logoHeight?: number;
}


// Expression evaluator for SurveyJS expressions
export class ExpressionEvaluator {
  private data: Record<string, any> = {};
  
  constructor(surveyData: Record<string, any> = {}) {
    this.data = surveyData;
  }
  
  updateData(newData: Record<string, any>) {
    this.data = { ...this.data, ...newData };
  }
  
  evaluate(expression: string): any {
    if (!expression) return true;
    
    try {
      // First check for direct comparison and contains/notcontains operators
      // These are better handled with direct string manipulation than JavaScript evaluation
      
      // Handle contains operator directly
      if (/ contains /.test(expression)) {
        const parts = expression.split(' contains ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          // Handle string literals by removing quotes
          const searchValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          return String(varValue || '').includes(searchValue);
        }
      }
      
      // Handle notcontains operator directly
      if (/ notcontains /.test(expression)) {
        const parts = expression.split(' notcontains ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          const searchValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          return !String(varValue || '').includes(searchValue);
        }
      }
      
      // Handle empty/notempty operators
      if (/ empty$/.test(expression.trim())) {
        const varName = expression.replace(/ empty$/, '').trim().replace(/[{}]/g, '');
        const value = this.getVariableValue(varName);
        return !value || value === '' || 
               (Array.isArray(value) && value.length === 0) || 
               (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
      }
      
      if (/ notempty$/.test(expression.trim())) {
        const varName = expression.replace(/ notempty$/, '').trim().replace(/[{}]/g, '');
        const value = this.getVariableValue(varName);
        return value && value !== '' && 
               !(Array.isArray(value) && value.length === 0) && 
               !(typeof value === 'object' && value !== null && Object.keys(value).length === 0);
      }
      
      // For simple equals conditions, handle directly (most common case)
      if (/ = /.test(expression) && !/ == /.test(expression) && !/ != /.test(expression)) {
        const parts = expression.split(' = ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          // Remove quotes for string comparison
          const compareValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          // Use loose equality (==) for type coercion
          // Use loose equality for SurveyJS compatibility, but avoid the lint warning
          // eslint-disable-next-line eqeqeq
          return String(varValue) == String(compareValue);
        }
      }
      
      // For not equal conditions
      if (/ <> /.test(expression)) {
        const parts = expression.split(' <> ');
        if (parts.length === 2) {
          const [varPart, valuePart] = parts.map(p => p.trim());
          const varName = varPart.replace(/[{}]/g, '');
          const compareValue = valuePart.replace(/^['"]|['"]$/g, '');
          const varValue = this.getVariableValue(varName);
          // Use loose inequality for SurveyJS compatibility, but avoid the lint warning
          // eslint-disable-next-line eqeqeq
          return String(varValue) != String(compareValue);
        }
      }
      
      // For more complex expressions, fall back to JavaScript evaluation
      let processedExpression = this.replaceVariables(expression);
      processedExpression = this.replaceSpecialFunctions(processedExpression);
      return this.safeEvaluate(processedExpression);
    } catch (error) {
      console.warn('Expression evaluation error:', error, 'Expression:', expression);
      return false;
    }
  }
  
  private replaceVariables(expression: string): string {
    // Check if this is a simple contains/notcontains expression and handle it directly
    if (/ contains | notcontains /.test(expression)) {
      return expression; // Let the contains/notcontains specific handler deal with this
    }
    
    // Replace {variableName} with actual values
    return expression.replace(/\{([^}]+)\}/g, (match, variable) => {
      const value = this.getVariableValue(variable);
      if (typeof value === 'string') {
        // Properly escape single quotes in strings
        return `'${value.replace(/'/g, "\\'").replace(/"/g, '\\"')}'`;
      } else if (value === null || value === undefined) {
        return 'null';
      }
      return String(value);
    });
  }
  
  private getVariableValue(variable: string): any {
    // Handle array indexing like {question[0]}
    if (variable.includes('[') && variable.includes(']')) {
      const [baseName, indexPart] = variable.split('[');
      const index = parseInt(indexPart.replace(']', ''));
      const baseValue = this.data[baseName];
      return Array.isArray(baseValue) ? baseValue[index] : undefined;
    }
    
    // Handle nested properties like {row.column} or {panel.question}
    if (variable.includes('.')) {
      const parts = variable.split('.');
      let value = this.data;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }
    
    return this.data[variable];
  }
  
  private replaceSpecialFunctions(expression: string): string {
    // Replace today() with current date
    expression = expression.replace(/today\(\)/g, `'${new Date().toISOString().split('T')[0]}'`);
    
    // Replace age() function
    expression = expression.replace(/age\(([^)]+)\)/g, (match, dateVar) => {
      const dateValue = this.getVariableValue(dateVar.replace(/[{}]/g, ''));
      if (dateValue) {
        const age = new Date().getFullYear() - new Date(dateValue).getFullYear();
        return String(age);
      }
      return '0';
    });
    
    // Replace sum() function
    expression = expression.replace(/sum\(([^)]+)\)/g, (match, vars) => {
      const variables = vars.split(',').map((v: string) => v.trim().replace(/[{}]/g, ''));
      const sum = variables.reduce((acc: number, variable: string) => {
        const value = this.getVariableValue(variable);
        return acc + (Number(value) || 0);
      }, 0);
      return String(sum);
    });
    
    // Replace iif() function (ternary operator)
    expression = expression.replace(/iif\(([^,]+),([^,]+),([^)]+)\)/g, '($1 ? $2 : $3)');
    
    return expression;
  }
  
  private safeEvaluate(expression: string): any {
    // At this point, we should have already handled the specific SurveyJS operators
    // This method just handles standard JavaScript expressions
    
    // Convert SurveyJS operators to JavaScript if any remain
    let jsExpression = expression
      .replace(/\s+<>\s+/g, ' !== ')
      .replace(/\s+=\s+/g, ' == ') // Use loose equality for type coercion
      .replace(/\s+and\s+/g, ' && ')
      .replace(/\s+or\s+/g, ' || ');
    
    // Use Function constructor for safe evaluation (better than eval)
    try {
      return new Function('return ' + jsExpression)();
    } catch (error) {
      console.log('Error evaluating expression:', error, jsExpression);
      // No need to call basicEvaluation anymore, just return false
      return false;
    }
  }
  
  private basicEvaluation(expression: string): boolean {
    // This method is no longer needed as we handle all expression types directly
    // Keeping it as a fallback just in case
    console.warn('Using basicEvaluation fallback for:', expression);
    return false;
  }
}


// Utility functions for parsing
function parseChoices(choices: any[]): ParsedChoice[] {
  if (!choices) return [];
  
  return choices.map(choice => {
    // Handle primitive types (string, number, etc.)
    if (typeof choice !== 'object' || choice === null) {
      const stringValue = String(choice);
      return { value: stringValue, text: stringValue };
    }
    
    // Handle object with value/text properties
    return {
      value: String(choice.value || choice.name || choice.text || ''),
      text: String(choice.text || choice.title || choice.value || choice.name || ''),
      enableIf: choice.enableIf,
      visibleIf: choice.visibleIf,
      imageLink: choice.imageLink // For imagepicker questions
    };
  });
}

function parseColumns(columns: any[]): ParsedColumn[] {
  if (!columns) return [];
  
  return columns.map(col => ({
    name: col.name,
    title: col.title,
    cellType: col.cellType,
    choices: col.choices ? parseChoices(col.choices) : undefined,
    inputType: col.inputType,
    isRequired: col.isRequired
  }));
}

function getQuestionVariant(question: any): string | undefined {
  const questionTypeInfo = QuestTypesList.find(q => q.type === question.type);
  if (!questionTypeInfo || !questionTypeInfo.variantKey) {
    return undefined;
  }
  
  const variantValue = question[questionTypeInfo.variantKey];
  if (questionTypeInfo.variants && questionTypeInfo.variants.includes(variantValue)) {
    return variantValue;
  }
  
  return 'default';
}

function parseQuestion(question: any, parentId?: string): ParsedQuestion {
  const questionId = parentId ? `${parentId}.${question.name}` : question.name;
  
  const parsed: ParsedQuestion = {
    id: questionId,
    name: question.name,
    type: question.type,
    variant: getQuestionVariant(question),
    title: question.title,
    description: question.description,
    isRequired: question.isRequired,
    defaultValue: question.defaultValue,
    placeholder: question.placeholder,
    
    // Logic properties
    visibleIf: question.visibleIf,
    enableIf: question.enableIf,
    requiredIf: question.requiredIf,
    setValueIf: question.setValueIf,
    setValueExpression: question.setValueExpression,
    defaultValueExpression: question.defaultValueExpression,
    resetValueIf: question.resetValueIf
  };
  
  // Type-specific parsing
  switch (question.type) {
    case 'radiogroup':
    case 'checkbox':
    case 'dropdown':
    case 'tagbox':
    case 'ranking':
      parsed.choices = question.choices ? parseChoices(question.choices) : [];
      
      // Handle choicesByUrl for dynamic data loading
      if (question.choicesByUrl) {
        parsed.choicesByUrl = question.choicesByUrl;
      }
      parsed.choices = parseChoices(question.choices);
      if (question.choicesByUrl) {
        parsed.choicesByUrl = {
          url: question.choicesByUrl.url,
          path: question.choicesByUrl.path ?? null,
          valueName: question.choicesByUrl.valueName,
          titleName: question.choicesByUrl.titleName
        };
      }
      break;
      
    case 'imagepicker':
      // Parse image choices including imageLink property
      parsed.choices = parseChoices(question.choices);
      
      // Add support for imagepicker specific properties
      parsed.imageHeight = question.imageHeight;
      parsed.imageWidth = question.imageWidth;
      parsed.multiSelect = question.multiSelect;
      parsed.contentMode = question.contentMode || 'image';
      parsed.imageFit = question.imageFit || 'cover';
      parsed.showLabel = question.showLabel !== false;
      
      if (question.choicesByUrl) {
        parsed.choicesByUrl = {
          url: question.choicesByUrl.url,
          path: question.choicesByUrl.path,
          valueName: question.choicesByUrl.valueName,
          titleName: question.choicesByUrl.titleName
        };
      }
      break;
      
    case 'image':
      // Parse image question properties for preset media display
      parsed.imageLink = question.imageLink;
      parsed.contentMode = question.contentMode || 'image'; // 'image', 'video', 'youtube'
      parsed.imageFit = question.imageFit || 'cover';
      parsed.imageHeight = question.imageHeight;
      parsed.imageWidth = question.imageWidth;
      break;
      
    case 'text':
      parsed.variant = question.inputType || 'default';
      parsed.min = question.min;
      parsed.max = question.max;
      parsed.step = question.step;
      parsed.minLength = question.minLength;
      parsed.maxLength = question.maxLength;
      break;
      
    case 'comment':
      parsed.maxLength = question.maxLength;
      parsed.minLength = question.minLength;
      break;
      
    case 'rating':
      parsed.rateMin = question.rateMin || 1;
      parsed.rateMax = question.rateMax || 5;
      parsed.rateStep = question.rateStep || 1;
      parsed.rateValues = question.rateValues ? parseChoices(question.rateValues) : undefined;
      break;
      
    case 'matrix':
      parsed.rows = parseChoices(question.rows);
      // For simple matrix, columns are treated as choices (radio buttons)
      parsed.choices = parseChoices(question.columns);
      break;
      
    case 'matrixdropdown':
    case 'matrixdynamic':
      parsed.rows = parseChoices(question.rows);
      parsed.columns = parseColumns(question.columns);
      parsed.rowCount = question.rowCount;
      parsed.minRowCount = question.minRowCount;
      parsed.maxRowCount = question.maxRowCount;
      break;
      
    case 'multipletext':
      parsed.elements = question.items?.map((item: any) => parseQuestion({
        ...item,
        type: 'text'
      }, questionId));
      break;
      
    case 'file':
      parsed.allowedTypes = question.acceptedTypes || question.allowedTypes;
      parsed.maxFileSize = question.maxSize;
      parsed.multiple = question.allowMultiple;
      break;
      
    case 'html':
      parsed.html = question.html;
      break;
      
    case 'expression':
      parsed.expression = question.expression;
      break;
      
    case 'signaturepad':
      parsed.backgroundColor = question.backgroundColor || '#ffffff';
      parsed.penColor = question.penColor || '#000000';
      parsed.penSize = question.penSize || 3;
      parsed.minWidth = question.minWidth || 0.5;
      parsed.maxWidth = question.maxWidth || 2.5;
      parsed.trimWhitespace = question.trimWhitespace !== false;
      break;
      
    case 'microphone':
      parsed.maxDuration = question.maxDuration || 300000; // 5 minutes default
      break;
      
    case 'panel':
    case 'paneldynamic':
      parsed.elements = question.elements?.map((el: any) => parseQuestion(el, questionId));
      if (question.type === 'paneldynamic') {
        parsed.minPanelCount = question.minPanelCount || 1;
        parsed.maxPanelCount = question.maxPanelCount || 10;
      }
      break;
  }
  
  return parsed;
}

function parsePage(page: any): ParsedPage {
  return {
    id: page.name,
    name: page.name,
    title: page.title,
    description: page.description,
    elements: page.elements?.map((el: any) => parseQuestion(el)) || [],
    
    // Page-level logic
    visibleIf: page.visibleIf,
    enableIf: page.enableIf,
    requiredIf: page.requiredIf,
    
    // Navigation
    navigationButtonsVisibility: page.navigationButtonsVisibility,
    questionsOrder: page.questionsOrder
  };
}

function parseTriggers(triggers: any[]): ParsedTrigger[] {
  if (!triggers) return [];
  
  return triggers.map(trigger => {
    const parsed: ParsedTrigger = {
      type: trigger.operator || trigger.type,
      expression: trigger.expression
    };
    
    switch (trigger.operator || trigger.type) {
      case 'setvalue':
        parsed.setToName = trigger.setToName;
        parsed.setValue = trigger.setValue;
        break;
      case 'copyvalue':
        parsed.setToName = trigger.setToName;
        parsed.fromName = trigger.fromName;
        break;
      case 'runexpression':
        parsed.runExpression = trigger.runExpression;
        parsed.setToName = trigger.setToName;
        break;
      case 'skip':
        parsed.gotoName = trigger.gotoName;
        break;
    }
    
    return parsed;
  });
}

// Main parser function
export function parseSurveyJS(surveyJSON: any): ParsedSurvey {
  try {
    const survey = typeof surveyJSON === 'string' ? JSON.parse(surveyJSON) : surveyJSON;
    
    const parsed: ParsedSurvey = {
      id: survey.surveyId,
      title: survey.title,
      description: survey.description,
      pages: [],
      triggers: parseTriggers(survey.triggers),
      
      // Survey settings
      showProgressBar: survey.showProgressBar,
      progressBarType: survey.progressBarType,
      showNavigationButtons: survey.showNavigationButtons,
      showTitle: survey.showTitle,
      showPageTitles: survey.showPageTitles,
      showQuestionNumbers: survey.showQuestionNumbers,
      questionErrorLocation: survey.questionErrorLocation,
      focusFirstQuestionAutomatic: survey.focusFirstQuestionAutomatic,
      goNextPageAutomatic: survey.goNextPageAutomatic,
      allowCompleteSurveyAutomatic: survey.allowCompleteSurveyAutomatic,
      
      // Validation
      checkErrorsMode: survey.checkErrorsMode,
      textUpdateMode: survey.textUpdateMode,
      
      // Completion
      completedHtml: survey.completedHtml,
      loadingHtml: survey.loadingHtml,
      
      // Branding
      logo: survey.logo,
      logoPosition: survey.logoPosition,
      logoWidth: survey.logoWidth,
      logoHeight: survey.logoHeight
    };
    
    // Parse pages
    if (survey.pages && survey.pages.length > 0) {
      parsed.pages = survey.pages.map(parsePage);
    } else if (survey.elements) {
      // Single page survey
      parsed.pages = [{
        id: 'page1',
        name: 'page1',
        elements: survey.elements.map((el: any) => parseQuestion(el))
      }];
    }
    
    return parsed;
  } catch (error) {
    console.error('Survey parsing error:', error);
    throw new Error(`Failed to parse survey: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to process dynamic content (placeholders)
export function processDynamicContent(content: string, surveyData: Record<string, any>): string {
  if (!content) return content;
  
  return content.replace(/\{([^}]+)\}/g, (match, variable) => {
    // Handle array indexing
    if (variable.includes('[') && variable.includes(']')) {
      const [baseName, indexPart] = variable.split('[');
      const index = parseInt(indexPart.replace(']', ''));
      const baseValue = surveyData[baseName];
      return Array.isArray(baseValue) ? (baseValue[index] || '') : '';
    }
    
    // Handle nested properties
    if (variable.includes('.')) {
      const parts = variable.split('.');
      let value = surveyData;
      for (const part of parts) {
        value = value?.[part];
      }
      return String(value || '');
    }
    
    return String(surveyData[variable] || '');
  });
}

// Utility function to evaluate survey logic
export function evaluateCondition(condition: string, surveyData: Record<string, any>): boolean {
  if (!condition) return true;
  
  const evaluator = new ExpressionEvaluator(surveyData);
  return evaluator.evaluate(condition);
}

// Get all questions from parsed survey (flattened)
export function getAllQuestions(parsedSurvey: ParsedSurvey): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  function extractQuestions(elements: ParsedQuestion[]) {
    for (const element of elements) {
      questions.push(element);
      if (element.elements) {
        extractQuestions(element.elements);
      }
    }
  }
  
  for (const page of parsedSurvey.pages) {
    extractQuestions(page.elements);
  }
  
  return questions;
}

// Get question by name
export function getQuestionByName(parsedSurvey: ParsedSurvey, name: string): ParsedQuestion | null {
  const allQuestions = getAllQuestions(parsedSurvey);
  return allQuestions.find(q => q.name === name) || null;
}

// Validate survey data against parsed survey
export function validateSurveyData(parsedSurvey: ParsedSurvey, surveyData: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Only validate questions on visible pages
  for (const page of parsedSurvey.pages) {
    // Skip validation for invisible pages
    if (page.visibleIf && !evaluateCondition(page.visibleIf, surveyData)) {
      continue;
    }
    
    // Validate all questions on this visible page
    for (const element of page.elements) {
      validateElement(element, surveyData, errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to validate an element (question or panel)
function validateElement(question: ParsedQuestion, surveyData: Record<string, any>, errors: string[]): void {
  const value = surveyData[question.name];
  
  // Check if element is visible and enabled
  const isVisible = !question.visibleIf || evaluateCondition(question.visibleIf, surveyData);
  const isEnabled = !question.enableIf || evaluateCondition(question.enableIf, surveyData);
  
  if (!isVisible || !isEnabled) return;
  
  // For panels, validate child elements
  if (question.elements) {
    for (const childElement of question.elements) {
      validateElement(childElement, surveyData, errors);
    }
    return;
  }
    
  // Check required fields
  const isRequired = question.isRequired || 
                    (question.requiredIf && evaluateCondition(question.requiredIf, surveyData));
  
  if (isRequired && (value === undefined || value === null || value === '')) {
    errors.push(`${question.title || question.name} is required`);
  }
  
  // Type-specific validation
  if (value !== undefined && value !== null && value !== '') {
    switch (question.type) {
      case 'text':
        if (question.variant === 'email' && !isValidEmail(String(value))) {
          errors.push(`${question.title || question.name} must be a valid email`);
        }
        if (question.variant === 'number' && isNaN(Number(value))) {
          errors.push(`${question.title || question.name} must be a number`);
        }
        if (question.minLength && String(value).length < question.minLength) {
          errors.push(`${question.title || question.name} must be at least ${question.minLength} characters`);
        }
        if (question.maxLength && String(value).length > question.maxLength) {
          errors.push(`${question.title || question.name} must be no more than ${question.maxLength} characters`);
        }
        break;
        
      case 'file':
        if (question.multiple && !Array.isArray(value)) {
          errors.push(`${question.title || question.name} must be an array for multiple files`);
        }
        break;
        
      case 'microphone':
        if (typeof value !== 'string') {
          errors.push(`${question.title || question.name} must be a valid audio file`);
        }
        break;
    }
  }
}

// Validate only questions on a specific page
export function validatePageData(page: ParsedPage, surveyData: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  function validateQuestions(questions: ParsedQuestion[]) {
    for (const question of questions) {
      const value = surveyData[question.name];
      
      // Check if question is visible and enabled
      const isVisible = !question.visibleIf || evaluateCondition(question.visibleIf, surveyData);
      const isEnabled = !question.enableIf || evaluateCondition(question.enableIf, surveyData);
      
      if (!isVisible || !isEnabled) continue;
      
      // Check required fields
      const isRequired = question.isRequired || 
                        (question.requiredIf && evaluateCondition(question.requiredIf, surveyData));
      
      if (isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`${question.title || question.name} is required`);
      }
      
      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        switch (question.type) {
          case 'text':
            if (question.variant === 'email' && !isValidEmail(String(value))) {
              errors.push(`${question.title || question.name} must be a valid email`);
            }
            if (question.variant === 'number' && isNaN(Number(value))) {
              errors.push(`${question.title || question.name} must be a number`);
            }
            if (question.minLength && String(value).length < question.minLength) {
              errors.push(`${question.title || question.name} must be at least ${question.minLength} characters`);
            }
            if (question.maxLength && String(value).length > question.maxLength) {
              errors.push(`${question.title || question.name} must be no more than ${question.maxLength} characters`);
            }
            break;
            
          case 'file':
            if (question.multiple && !Array.isArray(value)) {
              errors.push(`${question.title || question.name} must be an array for multiple files`);
            }
            break;
        }
      }
      
      // Recursively validate nested questions (panels, etc.)
      if (question.elements) {
        validateQuestions(question.elements);
      }
    }
  }
  
  validateQuestions(page.elements);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export the question types list for external use
// export { QuestTypesList };

// Export for use in React Native components
export function createSurveyState(parsedSurvey: ParsedSurvey) {
  // Initialize evaluator
  const evaluator = new ExpressionEvaluator();
  
  // Create initial state
  const initialData: Record<string, any> = {};
  
  // Process any default values and default value expressions
  const allQuestions = getAllQuestions(parsedSurvey);
  for (const question of allQuestions) {
    // Check if there's a default value expression
    if (question.defaultValueExpression) {
      try {
        const result = evaluator.evaluate(question.defaultValueExpression);
        if (result !== undefined) {
          initialData[question.name] = result;
          // Update evaluator immediately so subsequent expressions can use this value
          evaluator.updateData({ [question.name]: result });
        }
      } catch (error) {
        console.error('Error evaluating default expression for', question.name, error);
        if (question.defaultValue !== undefined) {
          initialData[question.name] = question.defaultValue;
          // Update evaluator with default value
          evaluator.updateData({ [question.name]: question.defaultValue });
        }
      }
    } else if (question.defaultValue !== undefined) {
      // Use regular default value if available
      initialData[question.name] = question.defaultValue;
      // Update evaluator with default value
      evaluator.updateData({ [question.name]: question.defaultValue });
    }
  }
  
  // Update evaluator with initial data
  evaluator.updateData(initialData);
  
  return {
    survey: parsedSurvey,
    currentPageIndex: 0,
    surveyData: initialData,
    evaluator,
    
    // Helper methods
    getCurrentPage() {
      return this.survey.pages[this.currentPageIndex];
    },
    
    updateAnswer(questionName: string, value: any) {
      this.surveyData[questionName] = value;
      this.evaluator.updateData(this.surveyData);
      
      // Process any default value expressions that might depend on this value
      const allQuestions = getAllQuestions(this.survey);
      for (const question of allQuestions) {
        if (question.name !== questionName && question.defaultValueExpression && 
            question.defaultValueExpression.includes(`{${questionName}}`) && 
            !this.surveyData[question.name]) {
          try {
            const newDefaultValue = this.processDefaultValueExpression(question);
            if (newDefaultValue !== undefined) {
              this.surveyData[question.name] = newDefaultValue;
            }
          } catch (error) {
            console.error('Error re-processing default value expression:', error);
          }
        }
      }
      
      // Process any question resets that might be triggered by this answer
      this.checkResetValues();
    },
    
    checkResetValues() {
      // Check all questions for resetValueIf conditions
      const allQuestions = getAllQuestions(this.survey);
      let dataChanged = false;
      
      for (const question of allQuestions) {
        if (question.resetValueIf && evaluateCondition(question.resetValueIf, this.surveyData)) {
          if (this.surveyData[question.name] !== undefined) {
            delete this.surveyData[question.name];
            dataChanged = true;
            
            // After resetting, check if we need to set a default value
            if (question.defaultValueExpression) {
              try {
                this.surveyData[question.name] = this.processDefaultValueExpression(question);
              } catch (error) {
                console.error('Error re-applying default value expression after reset:', error);
                if (question.defaultValue !== undefined) {
                  this.surveyData[question.name] = question.defaultValue;
                }
              }
            } else if (question.defaultValue !== undefined) {
              this.surveyData[question.name] = question.defaultValue;
            }
          }
        }
      }
      
      // Update evaluator with potentially changed data
      if (dataChanged) {
        this.evaluator.updateData(this.surveyData);
      }
    },
    
    // Process default value expressions for a question (used when showing a new question)
    processDefaultValueExpression(question: ParsedQuestion): any {
      if (!question.defaultValueExpression) return question.defaultValue;
      
      try {
        return this.evaluator.evaluate(question.defaultValueExpression);
      } catch (error) {
        console.error('Error evaluating default expression for', question.name, error);
        return question.defaultValue;
      }
    },
    
    isQuestionVisible(question: ParsedQuestion): boolean {
      return !question.visibleIf || evaluateCondition(question.visibleIf, this.surveyData);
    },
    
    isQuestionEnabled(question: ParsedQuestion): boolean {
      return !question.enableIf || evaluateCondition(question.enableIf, this.surveyData);
    },
    
    isQuestionRequired(question: ParsedQuestion): boolean {
      return Boolean(question.isRequired) || 
             (question.requiredIf ? evaluateCondition(question.requiredIf, this.surveyData) : false);
    },
    
    isPageVisible(page: ParsedPage): boolean {
      // Check if the page has a visibleIf condition and evaluate it
      return !page.visibleIf || evaluateCondition(page.visibleIf, this.surveyData);
    },
    
    canGoToNextPage(): boolean {
      const currentPage = this.getCurrentPage();
      
      // Check if page is visible
      if (!this.isPageVisible(currentPage)) {
        return true; // Skip invisible pages
      }
      
      // Validate required questions on current page only
      const validation = validatePageData(currentPage, this.surveyData);
      return validation.isValid;
    },
    
    nextPage() {
      if (this.currentPageIndex < this.survey.pages.length - 1) {
        // Move to next page
        this.currentPageIndex++;
        
        // Skip pages that aren't visible due to conditions
        while (
          this.currentPageIndex < this.survey.pages.length - 1 && 
          !this.isPageVisible(this.survey.pages[this.currentPageIndex])
        ) {
          this.currentPageIndex++;
        }
      }
    },
    
    previousPage() {
      if (this.currentPageIndex > 0) {
        // Move to previous page
        this.currentPageIndex--;
        
        // Skip pages that aren't visible due to conditions
        while (
          this.currentPageIndex > 0 && 
          !this.isPageVisible(this.survey.pages[this.currentPageIndex])
        ) {
          this.currentPageIndex--;
        }
      }
    },
    
    // Check if there are any visible pages after the current one
    hasVisiblePagesAfterCurrent(): boolean {
      for (let i = this.currentPageIndex + 1; i < this.survey.pages.length; i++) {
        if (this.isPageVisible(this.survey.pages[i])) {
          return true;
        }
      }
      return false;
    },
    
    validateCurrentPage() {
      return validatePageData(this.getCurrentPage(), this.surveyData);
    }
  };
}

// Type for the survey state
export type SurveyState = ReturnType<typeof createSurveyState>;

// Add a new utility to load choices from Zone data
export async function getChoicesFromZoneUrl(choicesByUrl: any, surveyData: Record<string, any> = {}): Promise<ParsedChoice[] | null> {
  if (!choicesByUrl || !choicesByUrl.url) return null;
  
  console.log('function is executed');

  try {
    // Replace placeholders in the URL and all params using surveyData (including nested/array values)
    const replacePlaceholders = (str: string): string => {
      return str.replace(/\{([^}]+)\}/g, (match, key) => {
        // Support nested and array values: e.g. {country}, {address.city}, {arr[0]}
        let value = surveyData;
        if (key.includes('[')) {
          // Array access
          const [base, idx] = key.split('[');
          const index = parseInt(idx.replace(']', ''));
          value = value[base];
          value = Array.isArray(value) ? value[index] : undefined;
        } else if (key.includes('.')) {
          // Nested property
          for (const part of key.split('.')) {
            value = value?.[part];
          }
        } else {
          value = value?.[key];
        }
        return value !== undefined && value !== null ? String(value) : '';
      });
    };

    let url = replacePlaceholders(choicesByUrl.url);
    const urlObj = new URL(url, 'http://dummy.base'); // base for relative URLs
    const path = urlObj.pathname;
    const pathSegments = path.split('/');
    const zoneId = pathSegments[pathSegments.length - 1];
    if (!zoneId) return null;
    // Get search params and replace placeholders in all param values
    const params: Record<string, string> = {};
    for (const [k, v] of urlObj.searchParams.entries()) {
      params[k] = replacePlaceholders(v);
    }
    // Load stored zones from database instead of AsyncStorage  
    const { getZoneContent } = await import('../services/database');
    const zoneData = await getZoneContent(zoneId);
    
    if (!zoneData) {
      console.warn(`Zone ${zoneId} not found in local database`);
      return null;
    }

    console.log(`Loaded zone ${zoneId} from database`);
    
    let data = zoneData;
    // If sheet specified, filter to that sheet
    if (params.sheet) {
      if (data[params.sheet]) {
        data = data[params.sheet];
      } else {
        console.warn(`Sheet ${params.sheet} not found in zone data`);
        return null;
      }
    }
    
    // Handle data format
    let items: Record<string, any>[] = Array.isArray(data) ? data : [];
    
    // Get value and title field names
    const valueField = choicesByUrl.valueName || (items[0] && Object.keys(items[0])[0]) || 'value';
    const titleField = choicesByUrl.titleName || valueField;
    
    // Apply sorting if specified
    if (params.sort_by) {
      const sortField = params.sort_by;
      const sortOrder = params.sort_order?.toLowerCase() === 'desc' ? -1 : 1;
      
      items.sort((a: Record<string, any>, b: Record<string, any>) => {
        const valueA = a[sortField];
        const valueB = b[sortField];
        return sortOrder * (valueA > valueB ? 1 : valueA < valueB ? -1 : 0);
      });
    }
    
    // Apply search filtering if specified
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      const searchColumn = params.column;
      items = items.filter((item: Record<string, any>) => {
        if (searchColumn && item[searchColumn]) {
          return String(item[searchColumn]).toLowerCase().includes(searchTerm);
        } else {
          // Search all columns
          return Object.values(item).some(val =>
            val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerm)
          );
        }
      });
    }

    // Apply distinct filtering if specified
    if (params.distinct) {
      const distinctField = params.distinct;
      const seenDistinct = new Set<string>();
      items = items.filter((item: Record<string, any>) => {
        const val = item[distinctField];
        if (val == null || val === '') return false;
        if (seenDistinct.has(val)) return false;
        seenDistinct.add(val);
        return true;
      });
    }

    // Apply pagination if specified
    if (params.limit) {
      const limit = parseInt(params.limit);
      const offset = params.offset ? parseInt(params.offset) : 0;
      items = items.slice(offset, offset + limit);
    }

    // Map to choices format, filter out null/undefined/empty and duplicates
    const seen = new Set<string>();
    const filtered = items.filter((item: Record<string, any>) => {
      // Remove null/undefined/empty value or text
      const value = item[valueField];
      const text = item[titleField] || item[valueField];
      if (value == null || value === '' || text == null || text === '') return false;
      // Remove duplicates by value
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
    return filtered.map((item: Record<string, any>) => ({
      value: String(item[valueField]),
      text: String(item[titleField] || item[valueField]),
    }));
    
  } catch (error) {
    console.error('Error loading zone data for choices:', error);
    return null;
  }
}