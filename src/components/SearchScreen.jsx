import React, { useState, useEffect } from 'react';

function SearchScreen({ prompts }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPrompts, setFilteredPrompts] = useState(prompts);

    // Function to handle copying text to clipboard
    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Handle successful copy feedback
            console.log('Text copied to clipboard');
        }).catch(err => {
            // Handle errors
            console.error('Failed to copy text: ', err);
        });
    };

    // Effect to filter prompts based on the search query
    useEffect(() => {
        if (searchQuery.length === 0) {
            setFilteredPrompts(prompts);
        } else {
            const filtered = prompts.filter(prompt =>
                prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredPrompts(filtered);
        }
    }, [searchQuery, prompts]);

    return (
        <div className="fixed inset-0 bg-gray-100 overflow-y-auto">
            <div className="flex flex-col min-h-screen">
                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 mb-4 w-full border border-gray-300 rounded-lg"
                />
                {/* Search Results */}
                <ul className="w-full">
                    {filteredPrompts.map((prompt, index) => (
                        <li
                            key={index}
                            className="p-4 border-b border-gray-300 cursor-pointer hover:bg-gray-200 rounded-lg"
                            onClick={() => handleCopyToClipboard(prompt.text)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCopyToClipboard(prompt.text);
                            }}
                            tabIndex={0}
                        >
                            <p className="text-lg font-semibold">{prompt.title}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default SearchScreen;
