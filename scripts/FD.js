const FD = (function () {
   
   "use strict";
   
   const SETTINGS = {DEFAULT_OUTPUT_FORMAT: "js"};

   // NAME & ID GENERATION ------------------------------------------- //
   
   /**
   * @description Generate unique ID string.
   * @param {Number} len - The length (number of characters) in the ID.
   */
   const generate_id = len => {
      const id_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
      let id = "";
      for ( let i = 0; i < len; i++ ){
         const new_char = id_chars.substr(Math.round((Math.random() * (id_chars.length - 1))), 1);
         id = `${id}${new_char}`;
      }
      return id;
   }

   // LOG MANAGEMENT ---------------------------------------------------- //

  
   const Log = {
     initialized: new Date(),
     session: generate_id(9),
     text: `FD.js (session ${Log.session}) initialized ${Log.initialized.toString()}.\n`
   };
   
   const SETTINGS = {
     DEFAULT_OUTPUT_FORMAT: "js",
     LOG_NAME: `FD_log_${Log.session}.txt`
   };
   
   /**
   * @description Update elapsed time since Log was initialized.
   * @param {datetime} `now` - The current time. Should be called with `Date.now()`
   */
   const update_time = (now = Date.now()) => {
     const seconds = ((now - Log.initialized) / 1000).toFixed(2);
     return `@+ ${seconds} seconds:\n`;
   }

   /**
   * @description Update session log.
   * @param {String} `message` - The text to add to the session log
   */
   const update_log = message => Log.text = `${Log.text}${update_time()} ${message}`;

   /**
   * @description Update or print current settings. `settings()' with no arguments will print
   * all settings to the console.
   * @param {String} `setting` - The name of the setting to update.
   * @param {String|Number|Boolean} `value` - The name of the value to assign to `setting`.
   */
   const settings = (setting, value) => {
      if (!!setting && !!value){
         SETTINGS[setting] = value;
         Log.text += update_log(`Settings updated...${setting} = ${value}`);
      } else {
         console.log(JSON.stringify(SETTINGS));
      }
   }

   /**
   * @description Prints session log to console.
   */
   const show_log = () => console.log(Log.text);

   /**
   * @description Prints user text to session log.
   * @param {String} `message` - The text to add to the session log.
   */
   const user_update = message => Log.text = `${Log.text}${update_time()} ${message}`;

   /**
   * @description Downloads the session log.
   */
   const save_log = () => {
      let element = document.createElement('a');
      element.setAttribute('href', ('data:text/plain;charset=utf-8,' + encodeURIComponent(Log.text)));
      element.setAttribute('download', (SETTINGS.LOG_NAME));
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      update_log("User downloaded a copy of the log as 'session_log_" + Log.session + ".txt'");
   }
   
   // ARRAY FUNCTIONS ---------------------------------------------------- //
   
   /**
   * @description Returns true if `element` is in `list`.
   * @param {Array|String} list - The Array or String in which to search for `element`.
   * @param {Boolean|Number|String} element - The value or substring to search `list` for.
   */
   const includes_element = (list, element) => (list.indexOf(element) > -1);

   /**
   * @description Returns true if `prop` is a property of `list`, which must be an Object.
   * @param {Object} `list` - The object in which to search for property `prop`.
   * @param {String} `prop` - The name of a property to search for.,
   */
   const includes_property = (list, prop) => includes_element(Object.keys(list), prop);

   /**
   * @description Returns an Array of distinct values from Array `arr`.
   * @param {Array} `arr` - The Array containing the (not necessarily unique) values.
   */
   const distinct_values = (arr) => {
      let result = [];
      for (let i=0; i < arr.length; i++){
         if (arr[i] !== null){
            if (!includes_element(result, arr[i])) result.push(arr[i]);
         }
      }
      return result;
   }

   /**
   * @description Returns number of missing values in Array `arr`.
   * @param {Array} `arr` - The Array in which to search for missing values.
   */
   const count_missing_values = (arr) => arr.filter(f => is_missing(f)).length;
   
   
   /**
   * @description Returns `true` if `test_value` is missing; otherwise, returns `false`.
   * @param {} `test_value` - value to test for missingness.
   */
   const is_missing = test_value => includes_element([null, undefined, NaN, ''], test_value);
   
   /**
   * @description Returns a metadata object (See below).
   * @param {Array} `data` - The data to derive metadata from.
   */
   const metadata = data => {
      let result;
      /* `result` will be:
      {"structure":"1d-array"|"2d-array"|"array_of_objects"|"object_of_arrays",
         "valid":true|false,
         "variables": {
           "name": {
             "type":"string"|"integer"|"real"|"boolean"|"mixed",
             "id": true|false,
             "missing": # of cases,
             "nonmissing": # of cases,
             "display_width": # of characters
             "valid": true|false
           }
         }
       } */
      if (!!data) {
         if (Array.isArray(data)) {
            const test_value = data[0];
            /* if `data` is Array AND first element is Array,
              evaluate `data` as two-dimensional Array */
            if (Array.isArray(data[0])){
               result = test_2d(data);
            }
            /* else if `data` is Array AND first element is Object,
              evaluate `data` as Array of Objects */
            else if (typeof test_value === "object"){
               result = test_array_of_objects(data);
            }
            else {
              /* else if `data` is Array,
                evaluate `data` as one-dimensional Array */
               result = test_1d(data);
            }
         }
         else {
           /* if `data` is NOT Array,
              evaluate `data` as Object of Arrays */
           result = test_object_of_arrays(data);
         }
         /* if `data` classified as one of four valid structures,
              return metadata Object */
         if (result.valid) return result;
      }
      /* if `data` is null or result.valid = false,
        throw error message */
      throw new Error("FD.metadata(): No valid data provided");
   }
   
   /**
   * @description Returns `data` as an Array of Objects.
   * @param {1d_array|2d_array|array_of_objects|object_of_arrays} `data` - data in one of the four
   * allowable structures.
   */
   const standardize_structure = data => {
      const result = {};
      let o;
      result.meta = metadata(data);
      if (result.meta.structure === "1d_array"){
         /* if `data` is one-dimensional Array,
              map `data` to Array of objects with Key set to index (zero) */
         result.standard = data.map(m => {'var0': m});
         o = "FD.standardize_structure(): '1d_array' converted to 'array_of_objects'.";
      }
      else if (result.meta.structure === "2d_array"){
         /* if `data` is two-dimensional Array AND first element is Array,
              iterate over Array `data` (i.e., observations) and over
              inner Array (i.e., variables). Variables names are simply the index */
         result.standard = data.reduce((acc, array) => {
           array.forEach((item, idx) => acc.push({ `var${idx}`: item } ));
           return acc;
         },[]);
         o = "FD.standardize_structure(): '2d_array' converted to 'array_of_objects'.";
      }
      else if (result.meta.structure === "array_of_objects"){
         /* if `data` is already in target format (Array of Objects),
              copy `data` into result.standard */
         result.standard = [...data];
         o = "FD.standardize_structure(): data is 'array_of_objects'.";
      }
      else if (result.meta.structure === "object_of_arrays"){
         /* if `data` is Object of Arrays),
              iterate over variables and index copying values to row Object
              for each index with property names copied from variables */
         let names = Object.keys(result.meta.variables);
         result.standard = [];
         for (let i = 0; i < data[names[0]].length; i++){
            let row = {};
            for (let j = 0; j < names.length; j++){
               row[names[j]] = data[names[j]][i];
            }
            result.standard.push(row);
         }
         o = "FD.standardize_structure(): 'object_of_arrays' converted to 'array_of_objects'.";
      }
      console.log(o);
      update_log(o);
      return result.standard.structure;
   }
   
   /**
   * @description Returns true if `thing` is of type String, Number, or Boolean.
   * @param { } `thing` - The value to test.
   */
   const scalar = test_value => (/string|number|boolean/).test(typeof test_value);

   /**
   * @description Returns type (string, integer, real, boolean, mixed) of values in `arr`.
   * @param {array} arr - The array of values to check for type.
   */
   const detect_type = (arr) => {
      let types = [];
      for (let i = 0; i < arr.length; i++){
         if (!scalar(arr[i])){
            throw new Error("detect_type(): input data must be array of scalar values.")
         } else {
            if (typeof arr[i] === "number"){
               /* If value is Number and contains a decimal point,
                    then add type real to Array `types`. Otherwise, add type integer. */
               if (arr[i].toString().indexOf(".") > -1){
                  types.push("real");
               } else {
                  types.push("integer");
               }
            }
            else {
               /* If value is not Number, add native type (i.e., string, boolean)
                    to Array `types`. */
               types.push(typeof arr[i]);
            }
         }
      }
      let dv = distinct_values(types);
      if (dv.length === 1) {
        /* If types are homogenous, return first value in Array `types`. */
         return types[0];
      }
      else if ((dv.length === 2) && (includes_element(dv, "integer")) && (includes_element(dv, "real"))) /* If data is mix of real and integer, return real. */
      {
         return "real";
      }
      
      else if (dv.length > 1) {
         /* Otherwise, if data includes multiple types, return mixed */
         return 'mixed';
      }
      else {
         return null;
      }
   }
   
   /**
   * @description Returns metadata information about about variables in `arr`.
   * @param {Array} `arr` - The Array of values to probe.
   * @param {String|integer} `name` - The variable name or array index to give to data in `arr`.
   */
   const test_variable = arr => {
      const variable = {};
      //variable.name = name;
      variable.missing = count_missing_values(arr);
      variable.nonmissing = arr.length - variable.missing;
      let values = distinct_values(arr);
      variable.distinct = values.length;
      variable.type = detect_type(values);
      /* If variable is type integer or string and has no missing values and no duplicate values,
           then flag as possible ID */
      variable.id = ((includes_element(["integer", "string"], variable.type)) && (variable.missing === 0) && (arr.length === values.length)) ? true : false;
      /* Variable flagged as valid if type is string, boolean, integer, or real,
           and has at least one non-null value */
      variable.valid = ((variable.type !== "mixed" ) && (variable.nonmissing > 0)) ? true : false;
      /* Each variable assigned a display size as greater of variable name length and
          maximum length of individual values and variable name */
      display_widths = arr.map(m => (m === null) ? 1 : m.toString().length);
      display_widths.push(name.toString().length);
      variable.display_size = display_widths.sort(descending)[0];
      return variable;
   }

   const test_1d = (arr) => {
      let result = {};
      result.structure = "1d_array";
      result.variables = {};
      result.variables['var0'] = test_variable(arr);
      result.valid = (result.variables['var0'].valid) ? true : false;
      return result;
   }

   const test_2d = (arr) => {
      let result = {};
      result.structure = '2d_array';
      result.variables = {};
      let vars = Object.keys(result.variables);
      for (let i = 0; i < arr[0].length; i++){
         result.variables[`var${i.toString()}`] = test_variable(arr.map(m => m[i]));
      }
      let vars = Object.keys(result.variables);
      result.valid = (vars.map(m => result.variables[m].valid).filter(f => f).length > 0) ? true : false;
      return result;
   }
   
   
   const test_array_of_objects = arr => {
      const result = {};
      result.structure = 'array_of_objects';
      result.variables = {};
      const props = Object.keys(arr[0]);
      for (let i = 0; i < props.length; i++){
         result.variables[props[i]] = test_variable(list.map(m => m[props[i]]));
      }
      let vars = Object.keys(result.variables);
      result.valid = (vars.map(m => result.variables[m].valid).filter(f => f).length > 0) ? true : false;
      return result;
   }

   const test_object_of_arrays = list => {
      const result = {};
      result.structure = 'object_of_arrays';
      result.variables = {};
      const props = Object.keys(list);
      for (let i = 0; i < props.length; i++){
         result.variables[props[i]] = test_variable(list[props[i]]);
      }
      let vars = Object.keys(result.variables);
      result.valid = (vars.map(m => result.variables[m].valid).filter(f => f).length > 0) ? true : false;
      return result;
   }
   
   /**
   * @description Ascending sort function for Array.sort()
   */
   const ascending = (a, b) => a - b;

   /**
   * @description Descending sort function for Array.sort()
   */
   const descending = (a, b) => b - a;
   
   /**
   * @description Returns a random element from array {arr}.
   * @param {Array} `arr` - the target array.
   */
   const random_element = arr => arr[random_int(arr.length - 1)];
   
   /**
   * @description Returns a random intenger between zero and `max`.
   * @param {Number} `max` - The maximum of the range to select from. Defaults to 1,000,000.
   */
   const random_int = (max = 1000000) => Number((Math.random() * max).toFixed(0));

   /**
   * @description Returns a random real nuber between zero and max.
   * @param {Number} `max` - The maximum of the range to select from. Defaults to 1,000,000.
   * @param {Number} `precision` - The number of places to the right of the decimal point.
   * Defaults to 5.
   */
   const random_real = (max = 1000000, precision = 5) => Number((Math.random() * max).toFixed(5));

   /**
   * @description Returns a random boolean value.
   * @param {Number} `proportion` - The assumed proportion of true values in the population.
   * Defaults to 0.500.
   */
   const coin_flip = (proportion = 0.5000) => (Math.random() <= proportion) ? true : false;

   /**
   * @description Returns either (`x` - `shift`) or (`x` + `shift`) assuming random selection from a population evenly split between the two.
   * @param {Number} `x` - The number to randomly add or substract `shift` from.
   * @param {Number} `shift` - The number to randomly add or substract from `x`.
   */
   const plus_or_minus = (x, shift) => coin_flip() ? x + shift : x - shift;

   /**
   * @description Returns Array of length `N` and data type (i.e., integer, real, order, rank, ID
   * string, or null value) equal to `mode`.
   * @param {Number} `N` - The length of the Array to generate.
   * @param {Number} `mode` - The data type with which to populate Array.
   */
   const dummy_array = (N = 1000, mode = 'empty') => {
      // modes: empty, order, boolean, numbers, words, IDs
      let dummy = [];
      for (let i = 0; i < N; i++){
         if (mode == 'empty') {
            dummy.push(null);
         }
         else if (mode == 'order') {
            dummy.push(i);
         }
         else if (mode == 'rank') {
            dummy.push(i + 1);
         }
         else if (mode == 'boolean') {
            dummy.push(coin_flip());
         }
         else if (mode == 'real') {
            dummy.push(random_real(1000000));
         }
         else if (mode == 'integer') {
            dummy.push(random_int(1000000));
         }
         else if (mode == 'ids') {
            dummy.push(generate_id(12));
         }
      }
      return dummy;
   };
   
   // ---------------------------- DATASET FUNCTIONS --------------------------------------- //
   
   /* There are four valid input data structures:
        1. Object of arrays...{"label":[1,2,3,4,5],"age":[6,7,8,9,0]}
        2. Array of objects...[{"name":"mike","alive":true},{"name":"mozart","alive":false}]
        3. One-dimensional array...[5,4,6,7,9]
        4. Two_dimensional array...[["adam", "andrew", "alex"],["jermaine", "jack", "joshua"],["nero", "nike", "nick"]]
   */
   
   const Stash = {};//'Stash' is a container for datasets and metadata
   
   /**
   * @description Assigns data `d` to a dataset Stash as Stash[`name`].standardized.
   * If no name is given, returns an array of existing datasets.
   * @param {String} `name` - The property name in Stash given to the dataset.
   * @param {Array|Object} `d` - The actual data to assign to a dataset. Must be one-dimensional array,
   * two-dimensional array, an array of objects, or object of arrays. If `d` is not an array of objects
   * it will be converted to one.
   */
   const dataset = (name, d) => {
      let o;
      if (!name){
        /* If `name` is null, return names of datasets in Stash */
        o = `FD.dataset(): Available datasets: ${Object.keys(Stash).join(", ")}\n\n`;
        console.log(o);
        update_log(o);
        return Object.keys(Stash);
      }
      else {
        if (includes_element(Object.keys(Stash), name)){
          /* Print wanring to console and session log if dataset 'name' already exists. */
          console.warn(`FD.dataset(): Overwriting existing dataset '${name}'.`);
          o = `FD.dataset(): Warning: Overwriting existing dataset '${name}'.\n\n`;
        }
        let meta = metadata(d);
        if (meta.valid) {
          /* If dataset is valid, assign standardized version to Stash[name].standardized
               and metadata to Stash[name].metadata */
          if (meta.structure === "array_of_objects"){
            Stash[name] = {"standardized": d, "metadata": meta};
          } else {
            /* convert data to an 'array_of_objects' structure */
            Stash[name].standardized = standardize_structure(d);
            Stash[name].metadata = metadata(Stash[name].standardized);
          }
          o = `${o}FD.dataset(): dataset '${name}' created with metadata:\n\n${JSON.stringify(meta)}\n\n`;
        }
        else {
          o = "FD.dataset(): invalid data.\n\n";
          throw new Error("FD.dataset(): invalid data.");
        }
        update_log(o);
      }
      return true;
   }
   
   /**
   * @description Return dataset with name = `name`.
   * @param {string} `name` - Name of target dataset.
   */
   const extract = name => Stash[name].standardized;
   
   /**
   * @description Marks `variable` in dataset `name` as an ID.
   * @param {String} `name` - Name of target dataset.
   * @param {String} `variable` - Name of target variable in dataset `name`.
   */
   const declare_id = (name, variable) => {
     let o;
     try {
       Stash[d].metadata.variables[variable].id = true;
       o = `FD.declare_id(): ID variable '${name}[${variable}]' declared.`;
       console.log(o);
     } catch (error){
       o = `FD.declare_id(): Could not declare '${name}[${variable}]' as ID variable.`;
       throw new Error(o);
     }
     update_log(o);
   }
   
   /**
   * @description Marks `variable` in dataset `name` as NOT an ID.
   * @param {String} `name` - Name of target dataset.
   * @param {String} `variable` - Name of target variable in dataset `name`.
   */
   const undeclare_id = (name, variable) => {
     let o = "";
     try {
       Stash[name].metadata.variables[variable].id = false;
       o = `FD.undeclare_id(): variable '${name}[${variable}]' undeclared an ID.\n\n`;
       console.log(o);
     } catch (error){
       o = `FD.declare_id(): Could not undeclare '${name}[${variable}]' as ID variable.\n\n`;
       throw new Error(o);
     }
     update_log(o);
   }
   
   /**
   * @description Finds variables common to two datasets.
   * @param {string}  name1 - name of first dataset.
   * @param {string}  name2 - name of second dataset.
   */
   const common_variabes = (name1, name2) => {
      let common = [];
      let vars1 = Object.keys(Stash[name1].metadata.variables);
      let vars2 = Stash[name2].metadata.variables.map(m => m.name);
      for (let i = 0; i < vars1.length; i++){
         if (includes_element(vars2, var1[i])) common.push(vars1[i]);
      }
      let o = `FD.common_variables(): Variables in both datasets '${d1}' and '${d2}': ${common.join(", ")}`;
      console.log(o);
      update_log(o);
      return common;
   }

   /**
   * @description Pretty prints dataset `name` to the console and the session log.
   * @param {String} `name` - name of target dataset.
   */
   const print_dataset = (name) => {
      let o = `FD.print_dataset(): Dataset '${name} (${Stash[d].standardized.length} rows):\n\n${ print_text(Stash[d].standardized, "\t")}`;
      console.log(msg);
      update_log(o);
   }

   /**
   * @description Removes specified variables from dataset.
   * @param {String}  `name` - name of target dataset.
   * @param {Array} `variables` - Array of names of target variables in dataset `name`.
   */
   const drop = (d, variables = []) => {
      for (let i = 0; i < Stash[d].standardized.length; i++){
         for (let j = 0; j < variables.length; j++){
            Stash[d].standardized[i].delete(variables[j]);
         }
      }
      Stash[d].metadata = metadata(Stash[d].standardized);
      let o = `FD.drop(): variables [${variables.join(", ")}] dropped from dataset '${d}'.`;
      console.log(o);
      update_log(o);
      return true;
   }
   
   /**
   * @description Returns new array-of-objects from datasets `name1` and `name2`.
   * Only variables common to both input datasets will be retained.
   * @param {String}  `name1` - name of first dataset.
   * @param {String} `name2` - name of second dataset.
   *
   */
   const glue = (name1, name2) => {
      let result = [], common = common_variables(name1, name2);
      /* Retain common variables from dataset `name1` */
      for (let i = 0; i < Stash[name1].standardized.length; i++){
         let row = {};
         for (let j = 0; j < common.length; j++){
            row[common[j] = Stash[name1].standardized[i][common[j]]);
         }
         result.push(row);
      }
      /* Retain common variables from dataset `name2` */
      for (let i = 0; i < Stash[name2].standardized.length; i++){
         let row = {};
         for (let j = 0; j < common.length; j++){
            row[common[j] = Stash[name2].standardized[i][common[j]]);
         }
         result.push(row);
      }
      let o = `FD.glue(): combined dataset {top} and {bottom}, including variables [${common.join(", "}].`;
      console.log(o);
      update_log(o);
      return result;
   }
   
   /**
   * Returns new array-of-objects from datasets `name1` and `name2`. Result will contain
   * all rows from `name1` and from `name2`. Only common variables will be retained.
   * @param {String} `name1` - name of first dataset.
   * @param {String} `name2` - name of second dataset.
   *
   */
   const outer_join = (name1, name2) => {
      for (let i = 0; i < Stash[d].standardized.length; i++){
         for (let j = 0; j < variables.length; j++){
            Stash[d].standardized[i].delete(variables[j]);
         }
      }
      Stash[d].metadata = metadata(Stash[d].standardized);
      let o = "FD.left_join(): combined dataset {top} and {bottom}, including variables [" + variables.join(", ") + "].";
      console.log(o);
      update_log(Date.now(), o);
      return true;
   }
   
   /**
   * Returns new array-of-objects from datasets `name1` and `name2`. Result will contain
   * all rows from `name1` including `name2` variables for matching rows.
   * @param {String} `name1` - name of first dataset.
   * @param {String} `name2` - name of second dataset.
   *
   */
   const left_join = (name1, name2) => {
      let result = [];
      for (let i = 0; i < Stash[name1].standardized.length; i++){
         
      }
      let o = `FD.left_join(): combined dataset '${name1}' and '${name2}', including variables: ${variables.join(", ")}.`;
      console.log(o);
      update_log(o);
      return result;
   }
   
   /**
   * Returns new array-of-objects from datasets `name1` and `name2`. Result will contain
   * only rows matching on all common variables from both datasets.
   * @param {String} `name1` - name of first dataset.
   * @param {String} `name2` - name of second dataset.
   */
   const inner_join = (name1, name2) => {
      let result = [];
      let o = `FD.left_join(): combined dataset '${name1}' and '${name2}', including variables: ${variables.join(", ")}.`;
      console.log(o);
      update_log(Date.now(), o);
      return result;
   }
   
   
   /**
   * Shuffles a dataset in-place.
   * @param {String}`name` - The name of the target dataset.
   */
   const shuffle = name => {
      let i = 0, j = 0, temp = null
      for (i = Stash[name].standardized.length - 1; i > 0; i -= 1) {
         j = Math.floor(Math.random() * (i + 1))
         temp = Stash[name].standardized[i];
         Stash[name].standardized[i] = Stash[d].standardized[j];
         Stash[name].standardized[j] = temp;
      }
      let o = `FD.shuffle(): shuffled dataset '${name}'.`;
      console.log(o);
      update.log(Date.now(), o);
      return true;
   }

   /**
   * Returns a random sample of size `n` from dataset `name`.
   * @param {String} `name` - The name of the target dataset.
   * @param {Number} `n` - The number of cases to select.
   */
   const random_sample = (name, n) => {
      let frame = [...Stash[name].standardized];
      shuffle(frame);
      let o = `FD.random_sample(): selected ${n} from dataset '${name}'.`;
      console.log(o);
      update.log(o);
      return frame.filter((f, index) => index < n);
   }
   
   /**
   * Prints text version of dataset.
   * @param {String} `d` - data.
   * @param {String} `delim` - Delimits variables.
   */
   const print_text = (d, delim) =>{
     const add_spaces = (text, size) => {
      let result = text;
      for (let i = 0; i < (size - text.toString().length); i++){
         result += " ";
      }
      return result;
     }
     const add_lines = size => {
      let result = '';
      for (let i = 0; i < size; i++){
         result += "=";
      }
      return result;
     }
     let result = "";
     let variables = Stash[d].metadata.variables.map(m => m.name);
     let widths = Stash[d].metadata.variables.map(m => m.display_size);
     for (let i = 0; i < variables.length; i++){
         result += add_spaces(variables[i], widths[i]);
         result += (i < (variables.length - 1)) ? delim : '';
     }
     result += "\n";
     for (let i = 0; i < variables.length; i++){
         result += add_lines(widths[i]);
         result += (i < (variables.length - 1)) ? delim : '';
     }
     result += "\n";
     for (let i = 0; i < Stash[d].standardized.length; i++){
         for (let j = 0; j < variables.length; j++){
            result += add_spaces(Stash[d].standardized[i][j], widths[j]);
            result += (j < (variables.length - 1)) ? delim : '';
         }
         result += "\n";
     }
     return result
   }
   
   /**
   * @descriptor Downloads a dataset.
   * @param {String} `name` - The name of the dataset.
   * @param {String} `filename` - The file name, including file extension, of the downloaded dataset
   * Valid output formats: .js, .json, .csv, .tsv, .json, .R, or .py.
   */
   const save_dataset = (name, file_name) => {
      let file_format = file_name.split(".")[1];
      let mime;
      let o = "FD.save_data(): ";
      if (file_format === 'json') {
            mime = 'text/json';
            dataset = JSON.stringify(Stash[name].standardized);
      }
      else if (file_format === 'js') {
            mime = 'text/javascript';
            dataset = 'let ' + file_name.split(".")[0] + ' = ' + JSON.stringify(Stash[name].standardized) + ';';
      }
      else if (file_format === 'csv'){
            mime = 'text/csv';
            dataset = print_text2(Stash[name].standardized), ",");
      }
      else if (file_format === 'tsv'){
            mime = 'text/tab-separated-values';
            dataset = print_text2(Stash[name].standardized, "   ");
      }
      else if (file_format === 'R') {
            mime = 'text/x-r';
            dataset = print_r(Stash[name].standardized, file_name.split(".")[0]);
      }
      else if (file_format === 'py') {
            mime = 'text/x-python';
            dataset = print_py(Stash[name].standardized, file_name.split(".")[0]);
      }
      else {
            throw new Error('save_data(): Valid output formats are ".js", ".json", ".csv", ".tsv", ".R", or ".py".');
      }
      let element = document.createElement('a');
      element.setAttribute('href', ('data:' + mime + ';charset=utf-8,' + encodeURIComponent(dataset)));
      element.setAttribute('download', file_name);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      o += `dataset '${name}' saved as ${file_name}.\n\n`;
      update_log(o);
   }
   
   /**
   * @descriptor Returns data as CSV or TSV.
   * @param {Array} `d` - The data as Array of Objects.
   * @param {String} `delim` - the delimiter.
   */
   const print_text2 = (d, delim) =>{
      let result = "";
      let meta = metadata(d);
      let variables = meta.variables.map(m => m.name);
      result += variables.join(delim) + "\n";
      for (let i = 0; i < d.length; i++){
         for (let j = 0; j < variables.length; j++){
            result += d[i][j];
            if (j < (variables.length - 1)) {
               result += delim;
            }
            else {
               result += "\n";
            }
         }
      }
      return result
   }

   /**
   * @descriptor Returns data as R statements that assign data `d` to a dataframe.
   * @param {Array} `d` - The data as Array of Objects.
   * @param {String} `name` - The name to be given to the dataframe.
   */
   const print_r = (d, name) =>{
      const r_convert = (type, value) => {
         if (includes_element([null, 'undefined', "NaN"], value)){
            return "NA";
         }
         else if (type === 'character') {
            return ("'" + value + "'");
         }
         else if (type === 'mixed'){
            return ("'" + value + "'");
         }
         else if (type === 'logical'){
            if (value === true){
               return 'TRUE';
            }
            else if (value === false){
               return 'FALSE';
            }
         }
         else {
            return value;
         }
      }
      let result = "#Remember to set working directory\nsetwd()\n" + name + " <- data.frame(";
      const types = {"real": "numeric", "integer": "numeric", "string":"character", "mixed":"character", "boolean":"logical"};
      let vars = d.meta.variables.map(m => [m.name, m.type]);
      for (let i = 0; i < vars.length; i++){
         result += vars[i][0] + " = " + types[vars[i][1]] + "(" + Stash[d].standardized.length + ")";
         if (i < (vars.length-1)){
            result += ", ";
         }
         else result += ")\n";
      }
      for (let i = 0; i < vars.length; i++){
         result += name + "$" + vars[i][0] + " <- c(";
         for (let j = 0; j < Stash[d].standardized.length; j++){
            result += r_convert(types[vars[i][1]], Stash[d].standardized[j][i]);
            if (j < (Stash[d].standardized.length - 1)) {
               result += ", ";
            }
         }
         result += ")\n";
      }
      return result;
      //Make this:
      //matty <- data.frame(id = character(3), max1 = numeric(3), max2 = numeric(3))
      //matty$id <- c("horrible", "terrible", "hopeless")
      //matty$max1 <- c(1000, 997, 765)
      //matty$max2 <- c(1000, 997, 765)
   }

   //TODO switch to input = array of objects
   const print_py = (d, name) =>{
      const py_convert = (type, value) => {
         if (type === "float") {
            return (!!value) ? value : "NaN";
         }
         else if (type === "int") {
            return (!!value) ? value : "NaN";
         }
         else if (type === "string") {
            return (!!value) ? '"' + value + '"' : '""';
         }
         else if (type === "bool") {
            return (value === true) ? "True" : "False";
         }
      }
      let result = name + " = {";
      const types = {"real": "float", "integer": "int", "string": "string", "boolean": "bool", "mixed": "string"};
      let vars = d.meta.variables.map(m => [m.name,m.type]);
      for (let i = 0; i < vars.length; i++){
         result += ("'" + vars[i][0] + "': [");
         for (let j = 0; j < Stash[d].standardized.length; j++){
            result += py_convert(types[vars[i][1]], Stash[d].standardized[j][i]);
            if (j < (Stash[d].standardized.length - 1)) {
               result += ", ";
            }
            else {
               result += "]";
            }
         }
         if (i < (vars.length - 1)){
            result += ", ";
         }
         else {
            result += "}\n";
         }
      }
      return result;
   }

   
   // COMBINATORICS ------------------------------------------------ //

   /**
   * Returns the factorial of {num}.
   * @param {number} num - Must be less than 40.
   */
   const factorial = num => {
      //if less than 20, compute actual factorial
      //if between 20 and 39, compute Stirling approximation
      //if 40 or more, return null
      //TODO handle cases >= 40 with string arithmetic
      if (num === 0 || num === 1) {
         return 1;
      }
      else if (num < 20) {
         for (var i = num - 1; i >= 1; i--) {
            num *= i;
         }
         return num;
      }
      else if (num < 40) {
         return Math.ceil(Math.sqrt(2 * Math.PI * num) * Math.pow((num / Math.E ), num));
      }
      else {
         throw new Error('factorial() can presently handle only inputs less than 40');
      }
   }

   /**
   * Returns the the number of different combinations of {k} items that can be chosen from {n} total items.
   * @param {number} n - The number of items to choose from.
   * @param {number} k - The number of items to choose
   */

   const combinations = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));

   /**
   * Returns the the number of different combinations of {k} not-necessarily-unique items that can be chosen from {n} total items.
   * @param {number} n - The number of items to choose from.
   * @param {number} k - The number of items to choose
   */
   const multicombinations = (n, k) => combinations((n + k - 1), k);

   /**
   * Returns the the number of possible subsets of any length that can be chosen from {n} total items.
   * @param {number} n - The total number of items to choose from.
   */
   const subsets = n => Math.pow(2, n);

   /**
   * Returns the the number of different permutations of {k} items that can be chosen from {n} total items.
   * @param {number} n - The number of items to choose from.
   * @param {number} k - The number of items to choose
   */
   const permutations = (n, k) => factorial(n) / factorial(n - k);


   // ARITHMETIC ------------------------------------------------ //

   /**
   * Returns the sum of values in {array} or {array[key]}.
   * @param {array} arr - May be 1d_array, a 2d_array with {key} equal to index, an array_of_objects with {key} equal to the target property.
   * @param {string|index} key - Optional. The target index of a 2d_array or the target property name of an array_of_objects
   */
   const sum = (arr, key = null) => {
      let value = 0;
      for (let a = 0; a < arr.length; a++ ){
         value += (!!key) ? arr[a][key] : arr[a];
      }
      return value;
   }

   /**
   * Returns the product of values in {array} or {array[key]}.
   * @param {array} arr - May be 1d_array, a 2d_array with {key} equal to index, an array_of_objects with {key} equal to the target property.
   * @param {string|index} key - Optional. The target index of a 2d_array or the target property name of an array_of_objects
   */
   const product = (arr, key = null) => {
      let value = 0;
      for (let a = 0; a < list.length; a++){
         value *= (!!key) ? arr[a][key] : arr[a];
      }
      return value;
   }
   
   
   // SET OPERATORS ----------------------------------------------------------- //

   /**
   * Returns an array of unique values found in either array {x} or array {y}.
   * @param {array} x - a 1d array.
   * @param {array} y - a 1d array.
   */
   const union = (x, y) => distinct_values(glue(x, y));

   /**
   * Returns an array of unique values found in both array {x} and array {y}.
   * @param {array} x - a 1d array.
   * @param {array} y - a 1d array.
   */
   const intersection = (x, y) => union(x, y).filter(f => ((includes_element(x, f)) && (includes_element(y, f))));

   /**
   * Returns an array of unique values found only in array {x} or only in array {y}.
   * @param {array} x - a 1d array.
   * @param {array} y - a 1d array.
   */
   const difference = ( x, y ) => {
      const inter = intersection( x, y );
      return union(x, y).filter(f => includes_element(inter, f) === false);
   }

   // EXPORT FUNCTIONS
   
   return {
      
      // SESSION MANAGEMENT
      
      user_update, show_log, save_log, settings,
      
      // ARRAY FUNCTIONS
      
      ascending, descending, random_element, dummy_array, includes_element, includes_property, distinct_values, count_missing_values, metadata, standardize_structure,
      
      // DATASET FUNCTIONS
      
      dataset, data, print_data, save_data, shuffle, random_sample, drop,
      
      // COMBINATORICS
      
      factorial, combinations, permutations, multicombinations, subsets,
      
      // ARITHMETIC OPERATORS
      
      sum, product,
      
      // SET OPERATORS
      
      union, intersection, difference,
      
      // RANDOMNESS
      
      random_int, random_real, coin_flip, plus_or_minus
      
   };
   
})();