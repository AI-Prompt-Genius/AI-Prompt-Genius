---
dg-publish: true
---

# v3.0.0 - Prompt variables, sidebar, and hotkey!

v3.0.0 brings a whole new slew of productivity features to ChatGPT. We've been able to take some ideas from [ChatBotUI.com](https://ChatBotUI.com) (which, for you copyright nerds, is under an MIT license) and apply them to ChatGPT in some pretty excotomg ways. 

### Prompt Variables
Prompt variables are values that change with each usage of the prompt. For example, Place double \{\{curly braces\}\} around a variable name and watch the magic happen.  For example:

**Output should be in the \{\{language\}\} language. Be sure to use correct grammar.**

Then, when you select the prompt, a modal will ask for variable values: 

![[screely-1682402359272.png]]

Prompts can have multiple of the same variable. Input will only be asked for once. For example:

**I want you to act like an expert in {{field}}. As an expert in {{field}}, you have been trained for forty years in {{field}}.**

The modal for this prompt looks like this: 

![[screely-1682465964425.png]]

To submit the modal, you can either click "Submit" or hit enter on your keyboard. 

### Prompt Sidebar & Collapsable Nav
Many users requested a way to create, edit, and delete prompts insde the ChatGPT interface. We have delivered with the prompt sidebar!

To create a new prompt, 