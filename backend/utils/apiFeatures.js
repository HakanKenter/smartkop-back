class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    // For search mathed keyword in name of all products, insensitive to breakage
    search() {
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {};

        console.log(keyword);
        this.query = this.query.find({ ...keyword })
        return this;
    }

    // Filters all elements sent except the keyword, the limit and the page 
    filter() {

        const queryCopy = { ...this.queryStr };

        // Removing fields from the query
        const removeFields = ['keyword', 'limit', 'page']
        removeFields.forEach(el => {
            delete queryCopy[el]
        })

        // Advance filter for price, ratings etc..
        let queryStr = JSON.stringify(queryCopy);
        // replace because for mongo wee need $ before each element of request
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

        this.query = this.query.find(JSON.parse(queryStr)).sort({createdAt: -1});  
        return this;
    }

    // represents the number of results to display per page
    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip)
        return this;
    }
}

module.exports = APIFeatures;