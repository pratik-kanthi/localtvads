const _functionsParser = require('./helperFunctions');

// need to look at:
// http://localhost:8080/api/rooms?$select=_id,Name,MaxCapacity,RoomTypeId/_id,RoomTypeId/CreationUserId&$expand=RoomTypeId/CreationUserId/TenantId

const selectExpandParser = (query, selected, expanded) => {
    if (selected) {
        const selectedArray = selected.split(',');
        if (expanded) {
            const expandedArray = expanded.split(',').map((e) => {
                return e.trim();
            });

            //build an object tree from the string. Select Tree in this case.
            const selectedTree = _functionsParser.buildTree(selected);

            //Invalid URL - Selecting something that is not expanded
            selectedArray.forEach((item) => {
                if (item.indexOf('/') !== -1 && expanded.indexOf(item.substring(0, item.lastIndexOf('/'))) === -1) {
                    throw 'Invalid URL - Selecting something that is not expanded';
                }
            });
            const validExpands = [];

            //Checking for Valid Expands
            expandedArray.forEach((expand) => {
                let level = selectedTree;
                const expandPaths = expand.split('/');
                const validParts = [];

                //Checking each part of the expand seperated by '/' against the Select tree
                expandPaths.every((part) => {

                    //if defined in the current level
                    if (level[part]) {
                        level = level[part];

                        //if not defined check if it is on the base level
                    } else if (level === selectedTree) {
                        return false;

                        // if not check the current level is not empty
                    } else if (Object.keys(level).length !== 0) {
                        return false;
                    }

                    validParts.push(part);
                    return true;
                });
                if (validParts.length > 0) {
                    validExpands.push(validParts.join('.'));
                }
            });

            //Create the options for deep populate. Selecting Properties of Expanded Objects
            const populateOptions = {};
            validExpands.forEach((path) => {

                //Object.keys converts property names to an array.
                const subSelected = Object.keys(_functionsParser.getSubPaths(selectedTree, path) || {}).join(' ');
                if (subSelected) {
                    populateOptions[path] = {
                        path: path,
                        select: subSelected
                    };
                }
            });

            //create select String. Only consider the parts before the /
            const selectString = _functionsParser.unique(selectedArray.map((s) => {
                return s.indexOf('/') !== -1 ? s.substring(0, s.indexOf('/')) : s;
            }));

            // Log the values. Used for debugging purposes.
            //return the query
            return query = query.select(selectString.join(' ')).deepPopulate(validExpands, {
                populate: populateOptions
            });
        } else {
            // check if something is selected with a slash (/) and is not expanded
            if (selected.indexOf('/') !== -1) {
                throw 'Entity is selected with a slash (/) and is not expanded.';
            }

            return query.select(selectedArray.join(' '));
        }
    } else {
        if (expanded) {
            //covert / into a regex to replace all instances of it => replace(/\//g,'.')
            return query.deepPopulate(expanded.replace(/\//g, '.').split(','));
        }
    }
};

const filterParser = (query, $filter) => {
    if (!$filter) {
        return;
    }

    const SPLIT_MULTIPLE_CONDITIONS = /(.+?)(?: && (?=(?:[^']*'[^']*')*[^']*$)|$)/g;
    const SPLIT_KEY_OPERATOR_AND_VALUE = /(.+?)(?: (?=(?:[^']*'[^']*')*[^']*$)|$)/g;

    let condition = undefined;
    if (_functionsParser.stringHelper.has($filter, ' && ')) {
        condition = $filter.match(SPLIT_MULTIPLE_CONDITIONS).map((s) => {
            return _functionsParser.stringHelper.removeEndOf(s, ' && ').trim();
        });

    } else {
        condition = [$filter.trim()];
    }

    for (let i = 0; i < condition.length; i++) {
        const item = condition[i];
        const conditionArr = item.match(SPLIT_KEY_OPERATOR_AND_VALUE).map((s) => {
            return s.trim();
        }).filter((n) => {
            return n;
        });
        if (conditionArr.length !== 3) {
            return new Error('Syntax error at \'#{item}\'.');
        }

        const _conditionArr = _functionsParser.slicedToArray(conditionArr, 3);

        const key = _conditionArr[0];
        const odataOperator = _conditionArr[1];
        let value = _conditionArr[2];

        value = _functionsParser.validator.formatValue(value);


        switch (odataOperator) {
        case 'eq':
            query.where(key).equals(value);
            break;
        case 'ne':
            query.where(key).ne(value);
            break;
        case 'gt':
            query.where(key).gt(value);
            break;
        case 'ge':
        case 'gte':
            query.where(key).gte(value);
            break;
        case 'lt':
            query.where(key).lt(value);
            break;
        case 'le':
        case 'lte':
            query.where(key).lte(value);
            break;
        default:
            return new Error('Incorrect operator at \'#{item}\'.');
        }
    }
    return query;
};

const topParser = (query, top) => {
    if (top > 0) {
        return query.limit(parseInt(top));
    } else {
        return query;
    }
};

const skipParser = (query, skip) => {
    if (skip > 0) {
        return query.skip(parseInt(skip));
    } else {
        return query;
    }
};

const orderByParser = (query, orderBy) => {
    if (!orderBy) {
        return;
    }

    const order = {};
    const orderbyArr = orderBy.split(',');

    orderbyArr.forEach((item) => {
        const data = item.trim().split(' ');
        if (data.length > 2) {
            return new Error('odata: Syntax error at \'' + orderBy + '\', it should be like \'ReleaseDate asc, Rating desc\'');
        }
        const key = data[0].trim();
        order[key] = data[1] || 'asc';
    });
    return query.sort(order);
};

module.exports = {
    selectExpandParser,
    filterParser,
    topParser,
    skipParser,
    orderByParser
};
