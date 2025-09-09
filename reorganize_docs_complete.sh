#!/bin/bash

# Manual reorganization for docs directory
DOCS_DIR="/Users/liang/Documents/code/react/no_hard_thing/cs-courses/cs-self-learning/docs"
NEW_DOCS_DIR="/Users/liang/Documents/code/react/no_hard_thing/cs-courses/cs-self-learning/docs-new"

# Main categories (excluding images)
categories=(
    "advanced-machine-learning"
    "advanced-mathematics"
    "artificial-intelligence"
    "compilers"
    "programming-introduction"
    "data-structures-algorithms"
    "deep-learning"
)

echo "Starting directory reorganization..."

for category in "${categories[@]}"; do
    if [ -d "$DOCS_DIR/$category" ]; then
        echo "Processing category: $category"
        
        # Create directories
        mkdir -p "$NEW_DOCS_DIR/zh/$category"
        mkdir -p "$NEW_DOCS_DIR/en/$category"
        
        # Process subdirectories
        find "$DOCS_DIR/$category" -type d -mindepth 1 -maxdepth 1 | while read -r subdir; do
            subdir_name=$(basename "$subdir")
            mkdir -p "$NEW_DOCS_DIR/zh/$category/$subdir_name"
            mkdir -p "$NEW_DOCS_DIR/en/$category/$subdir_name"
            
            # Copy Chinese files (.md files that don't end with .en.md)
            find "$subdir" -name "*.md" ! -name "*.en.md" -type f | while read -r file; do
                file_name=$(basename "$file")
                cp "$file" "$NEW_DOCS_DIR/zh/$category/$subdir_name/$file_name"
                echo "  Copied Chinese: $category/$subdir_name/$file_name"
            done
            
            # Copy and rename English files (.en.md -> .md)
            find "$subdir" -name "*.en.md" -type f | while read -r file; do
                file_name=$(basename "$file" .en.md).md
                cp "$file" "$NEW_DOCS_DIR/en/$category/$subdir_name/$file_name"
                echo "  Copied English: $category/$subdir_name/$file_name"
            done
        done
        
        # Copy files directly in category directory
        # Chinese files
        find "$DOCS_DIR/$category" -maxdepth 1 -name "*.md" ! -name "*.en.md" -type f | while read -r file; do
            file_name=$(basename "$file")
            cp "$file" "$NEW_DOCS_DIR/zh/$category/$file_name"
            echo "  Copied Chinese (direct): $category/$file_name"
        done
        
        # English files
        find "$DOCS_DIR/$category" -maxdepth 1 -name "*.en.md" -type f | while read -r file; do
            file_name=$(basename "$file" .en.md).md
            cp "$file" "$NEW_DOCS_DIR/en/$category/$file_name"
            echo "  Copied English (direct): $category/$file_name"
        done
    fi
done

# Copy images directory
if [ -d "$DOCS_DIR/images" ]; then
    cp -r "$DOCS_DIR/images" "$NEW_DOCS_DIR/"
    echo "Copied images directory"
fi

echo "Directory reorganization completed!"