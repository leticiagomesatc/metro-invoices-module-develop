import { SearchProvider } from "./search-provider";

export abstract class AbstractSearch {


    filters : any = {};
    pageable : any;
    page : any;

    
    abstract get provider(): SearchProvider; 

    public search() {

    }
}