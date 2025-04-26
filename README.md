# docscan

Document analyzer for teachers

This tool is a document analyzer for teachers to create material, analyze files, grade files, etc. using LLMs

Currently, the application is only able to analyze text based files such as .txt and .pdf. Images are not supported yet.

A demo of the application is [here](https://youtu.be/C5ZB9GgojCc)

# Getting Started

**Prerequisites**
Either

- Docker Desktop
- LLM either running locally with an application such as Ollama or with OpenAPI Key
  - Currently, this application only supports local LLMS through runners such as Ollama

Or

- Node >= 18
- Python >= 3.9
- LLM either running locally with an application such as Ollama or with OpenAPI Key
  - Currently, this application only supports local LLMS through runners such as Ollama
- PostgreSQL

## Docker

The preferred setup since there are many components.

1. Navigate to the root directory and run `docker compose up -d`
    - `docker compose down` to stop the containers
    - `docker compose down --volumes` to stop the containers and remove the volumes
    - `docker compose watch` to watch for changes in the code and rebuild the containers
    - This creates a backend, frontend, and PostgreSQL container onto a shared docker network that they use to communicate as if on localhost

2. Head to `localhost:5174` to view the frontend
3. Head to `localhost:8000/docs` to view the API documentation

If you want to run the frontend and backend separately:

1. Navigate to the `frontend` or `backend` directory and run the docker commands shown above.
    - Each directory has their own Dockerfile and docker-compose.yml file.

*There is currently no production level steps or builds yet. If so, a Dockerfile in root would be used to compile the frontend, add it to an app folder along with the backend server, and then serve the frontend with a web server such as Nginx/Apache or serve from the backend server itself.*

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
