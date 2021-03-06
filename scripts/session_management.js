const SETTINGS = {DEFAULT_OUTPUT_FORMAT: "js"};

// NAME & ID GENERATION ------------------------------------------- //
/**
 * Generate unique ID string.
 * @param {number} len - The length (number of characters) in the ID.
 */
 const generate_id = len => {
  const id_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let id = "";
  for ( let i = 0; i < len; i++ ){
    id += id_chars.substr(   Math.round(  ( Math.random() * ( id_chars.length-1 ) )  ), 1   );
  }
  return id;
}

// LOG MANAGEMENT ---------------------------------------------------- //

const Log = { text: "", updated: null };
Log.session = generate_id(9);
Log.initialized = new Date();
//Initialize Log
//Should this .map() use templating?
Log.text += "Basic.js (session '" + Log.session + "') initialized " +
            Log.initialized.toString() +
            " with settings:\n" +
            Object.entries(SETTINGS)
                .map( e => "  " + e[0] + " = " + e[1])
                .join("\n") +
            "\n\n";

const update_time = now => "@+" + ( (now - Log.initialized)/1000 ).toFixed( 2 ) +  " seconds: ";

const log_message = msg => msg + "\n\n";

/**
 * Update session log.
 * @param {datetime} now - The current time. Should be called with `date.now()`
 * @param {string} message - The text to add to the session log
 */
const update_log = (now, message) => Log.text += update_time( now ) + log_message( message );

/**
 * Update or print current settings. `settings()' will print settings to the console.
 * @param {object} setting - The name of the setting to update.
 * @param {object} value - The name of the value to assign to `setting`.
 */
const settings = (setting, value) => {
    if (!!setting && !!value){
      SETTINGS[setting] = value;
      Log.text += update_log("Settings updated..." + setting + " = " + value);
    } else {
      console.log(JSON.stringify(SETTINGS));
    }
};

/**
 * Prints session log to console..
 
 */
const show_log = () => console.log( Log.text );

/**
 * Prints user text to log.
 * @param {string} user_text - The text to add to the session log.
 */
const user_update = (user_text = "User updated the log.") => {
  Log.text += update_log( Date.now(), user_text);
}

/**
 * Downloads the session log.
 */
const save_log = () => {
 let element = document.createElement('a');
 element.setAttribute('href', ('data:text/plain;charset=utf-8,' + encodeURIComponent(Log.text)));
 element.setAttribute('download', ('session_log_' + Log.session + ".txt"));
 element.style.display = 'none';
 document.body.appendChild(element);
 element.click();
 document.body.removeChild(element);
 update_log("User downloaded a copy of the log as 'session_log_" + Log.session + ".txt'");
}