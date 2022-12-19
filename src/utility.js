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

/*
	mirror the state in a non-binary tree
	we use a class for convenience and namespace;
	to export to JSON, use the dedicated .toJSON() function 
 */
function TreeNode(data)
{
	this.leaves = [];
	this.data = data;
	// instance 
	this.currentLeafIndex = -1;
}

TreeNode.prototype.getData = function()
{
	return this.data;
}

TreeNode.prototype.getCurrentLeaf = function()
{
	return this.leaves[this.currentLeafIndex];
}

TreeNode.prototype.getLeaves = function()
{
	return this.leaves;
}

TreeNode.prototype.getNumberOfLeaves = function()
{
	return this.leaves.length;
}

TreeNode.prototype.getCurrentLeafIndex = function()
{
	return this.currentLeafIndex;
}

TreeNode.prototype.addLeaf = function(leaf)
{
	this.leaves.push(leaf);
	this.currentLeafIndex++;
}

TreeNode.prototype.addLeafCurrentLeaf = function(leaf)
{
	let currentLeaf = this.leaves[this.currentLeafIndex];
	if(currentLeaf)
	{
		currentLeaf.addLeaf(leaf);
	}
}

TreeNode.prototype.addLeafByData = function(data)
{
	let leaf = new TreeNode(data);
	this.addLeaf(leaf);
}

TreeNode.prototype.setData = function(data)
{
	this.data = data;
}

TreeNode.prototype.setCurrentLeafIndex = function(index)
{
	this.currentLeafIndex = index;
}

TreeNode.prototype.incrementCurrentLeafIndex = function()
{
	this.currentLeafIndex++;
}

TreeNode.prototype.decrementCurrentLeafIndex = function()
{
	this.currentLeafIndex--;
}

// traverses the tree according to the current leaf indices
// returns the data in an array, much like the old .convo field
TreeNode.prototype.getCurrentData = function()
{
	let data = [this.data];
	let currentLeaf = this.leaves[this.currentLeafIndex];
	let leafData = [];
	if(currentLeaf)
	{
		leafData = currentLeaf.getCurrentData();
	}
	return data.concat(leafData);
}

// return a primitive data version for storage
TreeNode.prototype.toJSON = function()
{
	let JSONObject = {data:this.data, leaves:[]};
	for(let index = 0, length = this.leaves.length; index < length; index++)
	{
		if(this.leaves[index])
		{
			JSONObject.leaves[index] = this.leaves[index].toJSON();
		}
		else 
		{
			console.warn(`TreeNode.toJSON: Empty object at index ${index}.`);
		}
	}
	return JSONObject;
}

// inflater from JSON; takes a {data: String, leaves: [...]} JSON primitive
TreeNode.prototype.fromJSON = function(JSONObject)
{
	this.data = JSONObject.data;
	for(let index = 0, length = JSONObject.leaves.length; index < length; index++)
	{
		this.addLeaf(new TreeNode());
		if(JSONObject.leaves[index])
		{
			// repeat recursively from a subtree
			this.leaves[index].fromJSON(JSONObject.leaves[index]);
		}
		else 
		{
			console.warn(`TreeNode.fromJSON: Empty object at index ${index}.`);
			console.log(JSONObject);
		}
	}
}