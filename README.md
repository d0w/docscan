# docscan

Document analyzer for teacheres

This tool is a document analyzer for teachers to create material, analyze files, grade files, etc. using LLMs

# Models and Breakdown

Users will need to be able to upload files. Should probably have a classroom/room model that keeps track of all students that are part of a classroom (this will hopefully take care of understanding what files can be accessed by who). File need to also have owners themselves, but as long as they are part of classrooms, a teacher of that classroom can access the file.

Should keep track of assignments. Given an assignment, they can have multiple files, and thus comments
**File**
id: uid()
filepath: absolute path to file
filename: name of file
owner: uid()

**User**
id: uid()
role: teacher, student, admin
