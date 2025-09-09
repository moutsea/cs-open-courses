#!/bin/bash

# Paths
DOCS_DIR="/Users/liang/Documents/code/react/no_hard_thing/cs-courses/cs-self-learning/docs"
NEW_DOCS_DIR="/Users/liang/Documents/code/react/no_hard_thing/cs-courses/cs-self-learning/docs-new"

echo "Starting directory reorganization..."

# Create language directories
mkdir -p "$NEW_DOCS_DIR/zh"
mkdir -p "$NEW_DOCS_DIR/en"

# Copy images directory (shared)
if [ -d "$DOCS_DIR/images" ]; then
    cp -r "$DOCS_DIR/images" "$NEW_DOCS_DIR/"
    echo "Copied images directory"
fi

# Get all category directories
categories=$(find "$DOCS_DIR" -maxdepth 1 -type d -name "*" ! -name "images" ! -name ".*" | tail -n +2)

for category in $categories; do
    category_name=$(basename "$category")
    echo "Processing category: $category_name"
    
    # Create category directories for both languages
    mkdir -p "$NEW_DOCS_DIR/zh/$category_name"
    mkdir -p "$NEW_DOCS_DIR/en/$category_name"
    
    # Process subdirectories and files
    find "$category" -type d -mindepth 1 | while read -r subdir; do
        subdir_path=$(echo "$subdir" | sed "s|$category/||")
        
        # Create subdirectories for both languages
        mkdir -p "$NEW_DOCS_DIR/zh/$category_name/$subdir_path"
        mkdir -p "$NEW_DOCS_DIR/en/$category_name/$subdir_path"
        
        # Copy Chinese files (.md without .en.md)
        find "$subdir" -name "*.md" ! -name "*.en.md" -type f | while read -r file; do
            relative_path=$(echo "$file" | sed "s|$category/||")
            cp "$file" "$NEW_DOCS_DIR/zh/$category_name/$relative_path"
            echo "  Copied Chinese: $relative_path"
        done
        
        # Copy English files (.en.md -> rename to .md)
        find "$subdir" -name "*.en.md" -type f | while read -r file; do
            relative_path=$(echo "$file" | sed "s|$category/||" | sed 's/\.en\.md$/.md/')
            cp "$file" "$NEW_DOCS_DIR/en/$category_name/$relative_path"
            echo "  Copied English: $relative_path"
        done
    done
    
    # Copy files directly in category directory
    # Chinese files
    find "$category" -maxdepth 1 -name "*.md" ! -name "*.en.md" -type f | while read -r file; do
        filename=$(basename "$file")
        cp "$file" "$NEW_DOCS_DIR/zh/$category_name/$filename"
        echo "  Copied Chinese (direct): $filename"
    done
    
    # English files
    find "$category" -maxdepth 1 -name "*.en.md" -type f | while read -r file; do
        filename=$(basename "$file" | sed 's/\.en\.md$/.md/')
        cp "$file" "$NEW_DOCS_DIR/en/$category_name/$filename"
        echo "  Copied English (direct): $filename"
    done
done

echo "Directory reorganization completed!"
echo "New structure:"
echo "- docs-new/zh/ (Chinese content)"
echo "- docs-new/en/ (English content)"
echo "- docs-new/images/ (Shared images)"