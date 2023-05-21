
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { MongoClient } from "mongodb";

class CollectionFunctions {
  constructor(collection) {
    this.collection = collection;
  }

  async get() {
    const res = await this.collection.find().toArray();
    return res;
  }
  async getSchema(){
    const schemaObj = await this.collection.findOne()
    function print(message){
      // console.log(message);
    }
    function printSchema(obj, indent) {
        for (let key in obj) {
            if(typeof obj[key] != "function"){     
                let specificDataTypes=[Date,Array,Object];    
                let type ="";
                for(let i in specificDataTypes){       
                  if(obj[key] instanceof specificDataTypes[i]){      
                    type = "==is_" + specificDataTypes[i].name + "==";    
                    break;
                  }
                }
                
                print(`${indent}${key} ${typeof obj[key]} ${type}`);
                
                if (typeof obj[key] == "object") {   '===='          
                printSchema(obj[key], indent + "\t");
              }    
            }
          }
    };
    printSchema(schemaObj,"");
    }
  }

const client = new MongoClient("mongodb://localhost:27017");
const dbName = "Graphql";
const db = client.db(dbName);

async function main() {
  const collectionList = await db.collections();
  const collectionNames = collectionList.map((collection) => collection.collectionName);
  const allCollections = collectionNames.map((collectionName) => {
    const collection = db.collection(collectionName);
    const cursorClass = new CollectionFunctions(collection);
    return cursorClass;
  });

  let combinedResults = [];

  for (let x of allCollections) {
    const res = await x.get();
    const schema = await x.getSchema();
    combinedResults = [...combinedResults, ...res];
  }
  return combinedResults
}

const dbResults = main();



// console.log(dbResults);


// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Profile {
    avatar: String,
    email: String,
    first_name: String,
    last_name: String,
    id: Int,
    job: Job,
  }

  type Job {
    absences: [String],
    hire_date: String,
    end_date: String,
    title: String,
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    profiles: [Profile]
  }
`;

// Resolvers define how to fetch the types defined in your schema.

const resolvers = {
  Query: {
    profiles: () => dbResults.then((res) => res),
  },
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
