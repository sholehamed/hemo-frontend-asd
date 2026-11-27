export class PageFilter {
    pageNumber: number = 1;
    pageSize: number = 10;
    sortBy: string = "Created";
    isDescending: boolean = true;
    filters: Filter[] = []
}
export class Filter {
    filterBy: string = "";
    value: string = "";
    operatorType: string = "";
}
