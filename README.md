# Geofreebie Backend

This little app serves data for geofreebie ([https://github.com/lbraun/geofreebie](https://github.com/lbraun/geofreebie)).

## Tests

To test the **contact** endpoints locally with curl, run:

```bash
# Create
curl -H "Content-Type: application/json" -d '{"name":"Geofreebie Support", "email": "support@geofreebie.com"}' http://localhost:8080/api/contacts

# Read (all)
curl -H "Content-Type: application/json" http://localhost:8080/api/contacts
```

Then run the following, replacing "xyz" with the id of the last created contact:

```bash
ID=xyz

# Read (one)
curl -H "Content-Type: application/json" http://localhost:8080/api/contacts/$ID

# Update
curl -H "Content-Type: application/json" -X PUT -d '{"name":"Geofreebie Support Guys","email":"support@geofreebie.com"}' http://localhost:8080/api/contacts/$ID/

# Delete
curl -H "Content-Type: application/json" -X DELETE http://localhost:8080/api/contacts/$ID/
```

To test the **user** endpoints locally with curl, run:

```bash
# Create
curl -H "Content-Type: application/json" -d '{"name":"Geofreebie Support", "email": "support@geofreebie.com"}' http://localhost:8080/api/users

# Read (all)
curl -H "Content-Type: application/json" http://localhost:8080/api/users
```

Then run the following, replacing "xyz" with the id of the last created user:

```bash
ID=xyz

# Read (one)
curl -H "Content-Type: application/json" http://localhost:8080/api/users/$ID

# Update
curl -H "Content-Type: application/json" -X PUT -d '{"name":"Geofreebie Support Guys","email":"support@geofreebie.com"}' http://localhost:8080/api/users/$ID/

# Delete
curl -H "Content-Type: application/json" -X DELETE http://localhost:8080/api/users/$ID/
```
