# Backend

## To test

1. Build the backend image:
```bash
docker build -t backend:latest .
```
This image contains the python runtime and all app code.


2. Build test image
```bash
docker build -t backend-test -f Dockerfile.test .
```
This image extends the backend test with extra tests and dependencies.

3. Run tests
```bash
docker compose run --rm test
```
This runs the compose flow "test" which creates a test sqldb and then runs the tests.
