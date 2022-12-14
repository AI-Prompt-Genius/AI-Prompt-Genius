function encode_string_as_blob(string)
{
	let bytes = new TextEncoder().encode(string);
	let blob = new Blob([bytes], {
		type: "application/json;charset=utf-8"
	});
	return blob;
}

// basially using the fileSaver.js, it's an IIFE to save on implementing the <a> singleton.
const download_blob_as_file = (function()
{
	let a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";
	return function (blob, file_name)
	{
		let url = window.URL.createObjectURL(blob);
		a.href = url;
        a.download = file_name;
        a.click();
		window.URL.revokeObjectURL(url);
	}
})();

/* conversion functions for export and download */
function convert_thread_to_JSON_file(thread)
{
	let data = thread;
	let string = JSON.stringify(data);
	let blob = encode_string_as_blob(string);
	return blob;
}

function convert_thread_to_text_file(thread)
{
	let string = "Date:" + thread.date + " " + thread.time + "\n";
	let convo = thread.convo;
	for(let i = 0; i < convo.length; i++)
	{
		let speaker = i % 2 === 0 ? "Human" : "Assistant";
		string += speaker + ": " + convo[i] + "\n";
	}
	let blob = encode_string_as_blob(string);
	return blob;
}

// takes an object as data
function export_and_download_data_as_blob(data, filename = "file.txt")
{
	let string = JSON.stringify(data);
	let blob = encode_string_as_blob(string);
	download_blob_as_file(blob, filename);
}