function getObjectById(id, list) { // created by ChatGPT
    // Iterate over the list of objects
    for (let i = 0; i < list.length; i++) {
        const obj = list[i];

        // Check if the object has an `id` property that matches the given id
        if (obj.id && obj.id === id) {
            // If a match is found, return the object
            return obj;
        }
    }

    // If no match is found, return null
    return null;
}

function generateUUID() {
	// create an array of possible characters for the UUID
	var possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	// create an empty string that will be used to generate the UUID
	var uuid = "";

	// loop over the possible characters and append a random character to the UUID string
	for (var i = 0; i < 36; i++) {
		uuid += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
	}

	// return the generated UUID
	return uuid;
}

// if we're here, we're probably in a state where either thread is malformed.
// thus, ignore bookmarks and only focus on dates and convo
function is_thread_deep_equals(thread, comparison_thread)
{
	let object = {date: thread.date, time: thread.time, convo: thread.convo};
	let comparison = {date: comparison_thread.date, time: comparison_thread.time, convo: comparison_thread.convo};
	return isObjectDeepEquals(object, comparison);
}

function get_thread_in_list_deep_equals(comparison, list) {
	for (let i = 0; i < list.length; i++) {
		let object = list[i];
		
		// check every property recursively
		if(is_thread_deep_equals(comparison, object)) 
		{
			return object;
		}
	}
	
	return null;
}

function get_object_in_list_deep_equals(comparison, list) {
	for (let i = 0; i < list.length; i++) {
		let object = list[i];
		
		// check every property recursively
		if(isObjectDeepEquals(comparison, object)) 
		{
			return object;
		}
	}
	
	return null;
}

function isObjectDeepEquals(original, comparison) {
	function CompareRecursively(left, right)
	{
		if(left instanceof Object)
		{
			if(left !== right)
			{
				// compare each key 
				for(var key in left)
				{
					if(!CompareRecursively(left[key], right[key])) return false;
				}
			}
		}
		else if(left instanceof Array)
		{
			if(left.length !== right.length) return false;
			// compare each element
			for(var index = 0, length = left.length; index < length; index++)
			{
				if(!CompareRecursively(left[index], right[index])) return false;
			}
		}
		else 
		{
			// compare the properties 
			if(left !== right) return false;
		}
		
		return true;
	}
	
	return CompareRecursively(original, comparison);
}