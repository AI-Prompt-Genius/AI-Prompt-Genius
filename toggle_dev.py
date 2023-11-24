import os

def replace_in_file(file_path, old_url, new_url):
    with open(file_path, 'r', encoding='utf-8') as file:
        filedata = file.read()

    filedata = filedata.replace(old_url, new_url)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(filedata)

def replace_in_directory(directory, old_url, new_url, extensions):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(tuple(extensions)):
                file_path = os.path.join(root, file)
                replace_in_file(file_path, old_url, new_url)
                print(f"Processed {file_path}")

def main():
    directory = input("Enter the directory path: ")
    mode = input("Enter mode (dev/prod): ")

    old_url_dev = 'https://lib.aipromptgenius.com'
    new_url_dev = 'http://localhost:5173'
    old_url_prod = 'http://localhost:5173'
    new_url_prod = 'https://lib.aipromptgenius.com'

    if mode == 'dev':
        replace_in_directory(directory, old_url_dev, new_url_dev, ['.html', '.js', '.json'])
    elif mode == 'prod':
        replace_in_directory(directory, old_url_prod, new_url_prod, ['.html', '.js', '.json'])
    else:
        print("Invalid mode. Please enter 'dev' or 'prod'.")

if __name__ == "__main__":
    main()
