const slicedToArray = (arr, i) => {
    if (Array.isArray(arr)) {
        return arr;
    } else if (Symbol.iterator in Object(arr)) {
        const _arr = [];
        let _n = true;
        let _d = false;
        let _e = undefined;
        let _i, _s;
        try {
            for (_i = arr[Symbol.iterator](); !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value);
                if (i && _arr.length === i) {
                    break;
                }
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i['return']) {
                    _i['return']();
                }
            } finally {
                if (_d) {
                    logger.logError(_e);
                }
            }
        }
        return _arr;
    } else {
        throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
};

// year(publish_date) eq 2000
const year = (query, key, odataOperator, value) => {
    key = key.substring(key.indexOf('(') + 1, key.indexOf(')'));
    const start = new Date(+value, 0, 1);
    const end = new Date(+value + 1, 0, 1);
    const condition = [{}, {}];
    switch (odataOperator) {
    case 'eq':
        query.where(key).gte(start).lt(end);
        break;
    case 'ne':
        condition[0][key] = {
            $lt: start
        };
        condition[1][key] = {
            $gte: end
        };
        query.or(condition);
        break;
    case 'gt':
        query.where(key).gte(end);
        break;
    case 'ge':
        query.where(key).gte(start);
        break;
    case 'lt':
        query.where(key).lt(start);
        break;
    case 'le':
        query.where(key).lt(end);
        break;
    default:
        break;
    }
};

//Build Object Tree from string
const buildTree = (select) => {
    const selectedArray = select.split(',');
    const tree = {};
    selectedArray.forEach((item) => {
        const path = item.split('/').map((i) => {
            return i.trim();
        });
        let level = tree;
        path.forEach((item) => {
            if (level[item]) {
                return;
            }
            level = level[item] = {};
        });
    });
    return tree;
};

//Return Unique values from an array
const unique = (a) => {
    return a.reduce((p, c) => {
        if (p.indexOf(c) < 0) {
            p.push(c);
        }
        return p;
    }, []);
};

//Get Subpath of a path
const getSubPaths = (tree, path) => {
    const pathParts = path.split('.');
    let level = tree;
    pathParts.every((part) => {
        if (!(level = level[part])) {
            level = null;
            return false;
        }
        return true;
    });
    return level;
};

const stringHelper = {
    has: (str, key) => {
        return str.indexOf(key) >= 0;
    },

    isBeginWith: (str, key) => {
        return str.indexOf(key) === 0;
    },

    isEndWith: (str, key) => {
        return str.lastIndexOf(key) === str.length - key.length;
    },

    removeEndOf: (str, key) => {
        if (stringHelper.isEndWith(str, key)) {
            return str.substr(0, str.length - key.length);
        }

        return str;
    }
};

const validator = {
    formatValue: (value) => {
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        if (+value === +value) {
            return +value;
        }
        if (stringHelper.isBeginWith(value, '\'') && stringHelper.isEndWith(value, '\'')) {
            return value.slice(1, -1);
        }
        return new Error('Syntax error at \'' + value + '\'.');
    }
};



module.exports = {
    year,
    slicedToArray,
    buildTree,
    unique,
    getSubPaths,
    stringHelper,
    validator
};
