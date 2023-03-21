function convoToTree(obj) {
    const keys = Object.keys(obj.mapping).sort();
    const messages = obj["mapping"]
    let firstItem = findTopParent(obj.current_node, messages)
    console.log(firstItem)
    let tree = new TreeNode(null)
    let convo = []
    function buildTree(node, tree){
        let newTree = new TreeNode(node.message.content.parts[0])
        tree.addLeaf(newTree)
        console.log(tree.currentLeafIndex)
        if (tree.currentLeafIndex === 0){
            convo.push(node.message.content.parts[0])
        }
        for (let each of node.children){
            buildTree(messages[each], newTree)
        }
    }
    for (let each of firstItem.children){
        buildTree(messages[each], tree)
    }
    const date = new Date(obj.create_time * 1000).toLocaleDateString();
    const time = new Date(obj.create_time * 1000).toLocaleTimeString();
    return {branch_state: tree.toJSON(), date: date, unified_id: true, convo: convo, time: time, title: obj.title, id: obj.current_node, favorite: false, create_time: obj.create_time}
}

function findTopParent(startingNodeId, tree) {
    let currentNode = tree[startingNodeId];
    while (currentNode.parent) {
        currentNode = tree[currentNode.parent];
    }
    let baseSystemNode = tree[currentNode.children[0]]
    return baseSystemNode;
}


const objectA = {
    "title": "Find top parent node.",
    "create_time": 1678649021.697309,
    "mapping": {
        "365537d1-7ad1-4588-a8b2-0d43817bb273": {
            "id": "365537d1-7ad1-4588-a8b2-0d43817bb273",
            "message": {
                "id": "365537d1-7ad1-4588-a8b2-0d43817bb273",
                "author": {
                    "role": "system",
                    "metadata": {}
                },
                "create_time": 1678649021.697309,
                "content": {
                    "content_type": "text",
                    "parts": [
                        ""
                    ]
                },
                "end_turn": true,
                "weight": 1,
                "metadata": {},
                "recipient": "all"
            },
            "parent": "179fe4a8-b3e4-4234-8a4f-fdc9649101d4",
            "children": [
                "74e7f181-b0b8-4f51-b487-2cf2937f5efd",
                "10790ad1-48dd-4f34-915a-c43ba4166227"
            ]
        },
        "179fe4a8-b3e4-4234-8a4f-fdc9649101d4": {
            "id": "179fe4a8-b3e4-4234-8a4f-fdc9649101d4",
            "children": [
                "365537d1-7ad1-4588-a8b2-0d43817bb273"
            ]
        },
        "74e7f181-b0b8-4f51-b487-2cf2937f5efd": {
            "id": "74e7f181-b0b8-4f51-b487-2cf2937f5efd",
            "message": {
                "id": "74e7f181-b0b8-4f51-b487-2cf2937f5efd",
                "author": {
                    "role": "user",
                    "metadata": {}
                },
                "create_time": 1678649021.697883,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "Write a function to return the top parent node starting with the given node"
                    ]
                },
                "weight": 1,
                "metadata": {
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "365537d1-7ad1-4588-a8b2-0d43817bb273",
            "children": [
                "8b7419fb-e0fe-4c29-a253-53dba6982ae3"
            ]
        },
        "8b7419fb-e0fe-4c29-a253-53dba6982ae3": {
            "id": "8b7419fb-e0fe-4c29-a253-53dba6982ae3",
            "message": {
                "id": "8b7419fb-e0fe-4c29-a253-53dba6982ae3",
                "author": {
                    "role": "assistant",
                    "metadata": {}
                },
                "create_time": 1678649027.313194,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "\n\nTo return the top parent node starting with the given node, we can keep traversing up the parent hierarchy until we reach the root node (i.e., a node with no parent).\n\nHere's an example function in Python that takes a starting node and returns the top parent node:\n\n```python\ndef get_top_parent(node):\n    \"\"\"\n    Returns the top parent node starting with"
                    ]
                },
                "weight": 1,
                "metadata": {
                    "model_slug": "text-davinci-002-render-sha",
                    "finish_details": {
                        "type": "interrupted"
                    },
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "74e7f181-b0b8-4f51-b487-2cf2937f5efd",
            "children": []
        },
        "10790ad1-48dd-4f34-915a-c43ba4166227": {
            "id": "10790ad1-48dd-4f34-915a-c43ba4166227",
            "message": {
                "id": "10790ad1-48dd-4f34-915a-c43ba4166227",
                "author": {
                    "role": "user",
                    "metadata": {}
                },
                "create_time": 1678649031.134831,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "Write a function to return the top parent node starting with the given node\n\nconst objectA = {\n    \"title\": \"Hello Assistance.\",\n    \"create_time\": 1678578132.080654,\n    \"mapping\": {\n        \"f768d14f-fd12-40ac-a315-8134e271c6b6\": {\n            \"id\": \"f768d14f-fd12-40ac-a315-8134e271c6b6\",\n            \"message\": {\n                \"id\": \"f768d14f-fd12-40ac-a315-8134e271c6b6\",\n                \"author\": {\n                    \"role\": \"system\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578132.080654,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"\"\n                    ]\n                },\n                \"end_turn\": true,\n                \"weight\": 1,\n                \"metadata\": {},\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"94192d9f-6876-40ba-890c-308f847a1e34\",\n            \"children\": [\n                \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\"\n            ]\n        },\n        \"94192d9f-6876-40ba-890c-308f847a1e34\": {\n            \"id\": \"94192d9f-6876-40ba-890c-308f847a1e34\",\n            \"children\": [\n                \"f768d14f-fd12-40ac-a315-8134e271c6b6\"\n            ]\n        },\n        \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\": {\n            \"id\": \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\",\n            \"message\": {\n                \"id\": \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\",\n                \"author\": {\n                    \"role\": \"user\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578132.081253,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"hello!\"\n                    ]\n                },\n                \"weight\": 1,\n                \"metadata\": {\n                    \"timestamp_\": \"absolute\"\n                },\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"f768d14f-fd12-40ac-a315-8134e271c6b6\",\n            \"children\": [\n                \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\"\n            ]\n        },\n        \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\": {\n            \"id\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\",\n            \"message\": {\n                \"id\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\",\n                \"author\": {\n                    \"role\": \"assistant\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578132.734925,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"Hello there! How can I assist you today?\"\n                    ]\n                },\n                \"end_turn\": true,\n                \"weight\": 1,\n                \"metadata\": {\n                    \"model_slug\": \"text-davinci-002-render-sha\",\n                    \"finish_details\": {\n                        \"type\": \"stop\",\n                        \"stop\": \"\"\n                    },\n                    \"timestamp_\": \"absolute\"\n                },\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\",\n            \"children\": [\n                \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\",\n                \"dfed8475-d633-4603-8a42-1f05aeb0686d\"\n            ]\n        },\n        \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\": {\n            \"id\": \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\",\n            \"message\": {\n                \"id\": \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\",\n                \"author\": {\n                    \"role\": \"user\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578140.626228,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"You can make me a sandwhich\"\n                    ]\n                },\n                \"weight\": 1,\n                \"metadata\": {\n                    \"timestamp_\": \"absolute\"\n                },\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\",\n            \"children\": [\n                \"c045a52b-ed21-4456-9d00-a83748a87e0a\"\n            ]\n        },\n        \"c045a52b-ed21-4456-9d00-a83748a87e0a\": {\n            \"id\": \"c045a52b-ed21-4456-9d00-a83748a87e0a\",\n            \"message\": {\n                \"id\": \"c045a52b-ed21-4456-9d00-a83748a87e0a\",\n                \"author\": {\n                    \"role\": \"assistant\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578149.979263,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"I'm sorry, but as an AI language model, I don't have the physical ability to make sandwiches for you. However, I can suggest a simple sandwich recipe that you can try making yourself! Here's one:\\n\\n**Classic Turkey and Cheese Sandwich Recipe**\\n\\nIngredients:\\n- 2 slices of bread\\n- 2-3 slices of turkey\\n- 1-2 slices of cheese\\n- 1-2 lettuce leaves\\n- 1-2 slices of tomato\\n- 1-2 tablespoons of mayonnaise\\n- Salt and pepper to taste\\n\\nInstructions:\\n\\n1. Toast the bread in a toaster or toaster oven until golden brown.\\n\\n2. Spread the mayonnaise on one side of each slice of bread.\\n\\n3. Layer the lettuce, turkey, cheese, and tomato slices on one slice of bread.\\n\\n4. Sprinkle salt and pepper over the sandwich filling.\\n\\n5. Top the sandwich with the other slice of bread.\\n\\n6. Cut the sandwich in half and serve.\\n\\nEnjoy your homemade sandwich!\"\n                    ]\n                },\n                \"end_turn\": true,\n                \"weight\": 1,\n                \"metadata\": {\n                    \"model_slug\": \"text-davinci-002-render-sha\",\n                    \"finish_details\": {\n                        \"type\": \"stop\",\n                        \"stop\": \"\"\n                    },\n                    \"timestamp_\": \"absolute\"\n                },\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\",\n            \"children\": []\n        },\n        \"dfed8475-d633-4603-8a42-1f05aeb0686d\": {\n            \"id\": \"dfed8475-d633-4603-8a42-1f05aeb0686d\",\n            \"message\": {\n                \"id\": \"dfed8475-d633-4603-8a42-1f05aeb0686d\",\n                \"author\": {\n                    \"role\": \"user\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578160.943268,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"you can't\"\n                    ]\n                },\n                \"weight\": 1,\n                \"metadata\": {\n                    \"timestamp_\": \"absolute\"\n                },\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\",\n            \"children\": [\n                \"d0b0c035-a154-4a34-80d7-ef2c57250bca\"\n            ]\n        },\n        \"d0b0c035-a154-4a34-80d7-ef2c57250bca\": {\n            \"id\": \"d0b0c035-a154-4a34-80d7-ef2c57250bca\",\n            \"message\": {\n                \"id\": \"d0b0c035-a154-4a34-80d7-ef2c57250bca\",\n                \"author\": {\n                    \"role\": \"assistant\",\n                    \"metadata\": {}\n                },\n                \"create_time\": 1678578162.513367,\n                \"content\": {\n                    \"content_type\": \"text\",\n                    \"parts\": [\n                        \"I'm sorry to hear that. If you ever have any questions or need assistance in the future, don't hesitate to ask. Have a great day!\"\n                    ]\n                },\n                \"end_turn\": true,\n                \"weight\": 1,\n                \"metadata\": {\n                    \"model_slug\": \"text-davinci-002-render-sha\",\n                    \"finish_details\": {\n                        \"type\": \"stop\",\n                        \"stop\": \"\"\n                    },\n                    \"timestamp_\": \"absolute\"\n                },\n                \"recipient\": \"all\"\n            },\n            \"parent\": \"dfed8475-d633-4603-8a42-1f05aeb0686d\",\n            \"children\": []\n        }\n    },\n    \"moderation_results\": [],\n    \"current_node\": \"d0b0c035-a154-4a34-80d7-ef2c57250bca\"\n}"
                    ]
                },
                "weight": 1,
                "metadata": {
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "365537d1-7ad1-4588-a8b2-0d43817bb273",
            "children": [
                "778e05c2-9668-4779-80cc-1d455b1ab7d4"
            ]
        },
        "778e05c2-9668-4779-80cc-1d455b1ab7d4": {
            "id": "778e05c2-9668-4779-80cc-1d455b1ab7d4",
            "message": {
                "id": "778e05c2-9668-4779-80cc-1d455b1ab7d4",
                "author": {
                    "role": "assistant",
                    "metadata": {}
                },
                "create_time": 1678649083.175729,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "Here's a JavaScript function that takes in a starting node ID and an object representing a tree structure, and returns the top parent node ID of the given node:\n\n```javascript\nfunction findTopParent(startingNodeId, tree) {\n  let currentNode = tree[startingNodeId];\n  while (currentNode.parent) {\n    currentNode = tree[currentNode.parent];\n  }\n  return currentNode.id;\n}\n```\n\nYou can use it like this:\n\n```javascript\nconst tree = {\n  \"f768d14f-fd12-40ac-a315-8134e271c6b6\": {\n    \"id\": \"f768d14f-fd12-40ac-a315-8134e271c6b6\",\n    \"parent\": \"94192d9f-6876-40ba-890c-308f847a1e34\"\n  },\n  \"94192d9f-6876-40ba-890c-308f847a1e34\": {\n    \"id\": \"94192d9f-6876-40ba-890c-308f847a1e34\"\n  },\n  \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\": {\n    \"id\": \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\",\n    \"parent\": \"f768d14f-fd12-40ac-a315-8134e271c6b6\"\n  },\n  \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\": {\n    \"id\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\",\n    \"parent\": \"02ff2ea7-2702-46b7-ae42-e2600f6cfe54\"\n  },\n  \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\": {\n    \"id\": \"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\",\n    \"parent\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\"\n  },\n  \"dfed8475-d633-4603-8a42-1f05aeb0686d\": {\n    \"id\": \"dfed8475-d633-4603-8a42-1f05aeb0686d\",\n    \"parent\": \"a7ef0be0-e936-4b2d-aaaa-5e2d4ca43b08\"\n  }\n};\n\nconsole.log(findTopParent(\"4ebb4150-5d8c-4db3-8e10-4d449e6806c2\", tree)); // Output: \"f768d14f-fd12-40ac-a315-8134e271c6b6\"\n``` \n\nNote that the input `tree` object in the above example has a different structure than the `objectA` in the original question, so you may need to adjust the function accordingly depending on your specific use case."
                    ]
                },
                "end_turn": true,
                "weight": 1,
                "metadata": {
                    "model_slug": "text-davinci-002-render-sha",
                    "finish_details": {
                        "type": "stop",
                        "stop": "<|im_end|>"
                    },
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "10790ad1-48dd-4f34-915a-c43ba4166227",
            "children": [
                "59fb4316-e6c1-4fd8-a9a8-7a52bb983d56"
            ]
        },
        "59fb4316-e6c1-4fd8-a9a8-7a52bb983d56": {
            "id": "59fb4316-e6c1-4fd8-a9a8-7a52bb983d56",
            "message": {
                "id": "59fb4316-e6c1-4fd8-a9a8-7a52bb983d56",
                "author": {
                    "role": "user",
                    "metadata": {}
                },
                "create_time": 1678649125.375075,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "Will this work if there's two parents (sibling nodes)"
                    ]
                },
                "weight": 1,
                "metadata": {
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "778e05c2-9668-4779-80cc-1d455b1ab7d4",
            "children": [
                "70a1c976-8734-46db-9cf1-68b0aae26b64"
            ]
        },
        "70a1c976-8734-46db-9cf1-68b0aae26b64": {
            "id": "70a1c976-8734-46db-9cf1-68b0aae26b64",
            "message": {
                "id": "70a1c976-8734-46db-9cf1-68b0aae26b64",
                "author": {
                    "role": "assistant",
                    "metadata": {}
                },
                "create_time": 1678649146.231511,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "The current implementation of the function assumes that there is only one parent for each node. If there are multiple parents for a node, the function may not return the correct result.\n\nTo handle cases where there are multiple parent nodes, you could modify the function to return an array of top-level parent nodes instead of a single node. The array would contain all the top-level parent nodes for the given node.\n\nHere's an example implementation of a function that returns an array of top-level parent nodes:\n\n```\nfunction getTopParentNodes(object, nodeId) {\n  const parentNodes = [];\n\n  let node = object.mapping[nodeId];\n  while (node && node.parent) {\n    node = object.mapping[node.parent];\n  }\n\n  // Traverse the tree in depth-first order\n  function traverse(node) {\n    if (!node.parent) {\n      parentNodes.push(node);\n      return;\n    }\n    traverse(object.mapping[node.parent]);\n  }\n\n  // Traverse the tree for each top-level parent node\n  parentNodes.forEach(parentNode => {\n    traverse(parentNode);\n  });\n\n  return parentNodes;\n}\n```\n\nThis implementation uses a recursive `traverse` function to traverse the tree starting from each top-level parent node. The function first finds all the top-level parent nodes for the given node, and then calls `traverse` for each of them. Finally, it returns an array of all the top-level parent nodes."
                    ]
                },
                "end_turn": true,
                "weight": 1,
                "metadata": {
                    "model_slug": "text-davinci-002-render-sha",
                    "finish_details": {
                        "type": "stop",
                        "stop": "<|im_end|>"
                    },
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "59fb4316-e6c1-4fd8-a9a8-7a52bb983d56",
            "children": []
        }
    },
    "moderation_results": [],
    "current_node": "70a1c976-8734-46db-9cf1-68b0aae26b64"
}

console.log(objectA)
const objectB = convoToTree(objectA);
console.log(objectB); // the transformed object