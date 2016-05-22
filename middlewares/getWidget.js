var exports = module.exports = {};
var widgetsList = require('../models/widgets');
var userPermission = require('../helpers/utility');
/**
 Function to get the widgets's details such as channel id,name,desciption ..
 @params 1.req contains the  user details i.e. username,token,email etc
 2.res have the query response

 */
exports.widgets = function (req, res, next) {

    /**
     * Query to find the widgets list
     * @params req.params.dashboardId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    if (req.user) {
        req.dashboardId = req.params.dashboardId;
        userPermission.checkUserAccess(req, res, function (err, response) {
            console.log('utility response', response)
            widgetsList.find({dashboardId: req.params.dashboardId}, function (err, widget) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (!widget.length)
                    return res.status(204).json({error: 'No records found'});
                else {
                    req.app.result = widget;
                    next();
                }
            })
        })

    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})

};

exports.widgetDetails = function (req, res, next) {

    /**
     * Query to find the widgets list
     * @params req.params.dashboardId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    if (req.user) {
        userPermission.checkUserPermission(req, res, function (err) {
            if(err)
                return res.status(500).json({error: 'Internal server error'});
            else{
                widgetsList.find({_id: req.params.widgetId}, function (err, widget) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!widget.length)
                        return res.status(204).json({error: 'No records found'});
                    else {
                        req.app.result = widget;
                        next();
                    }
                })
            }

        })

    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})

};

exports.deleteWidgets = function (req, res, next) {
    if (req.user) {
        userPermission.checkUserPermission(req, res, function (err) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else
                widgetsList.remove({_id: req.params.widgetId}, function (err, widget) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!widget)
                        return res.status(501).json({error: 'Not implemented'})
                    else {
                        req.app.result = req.params.widgetId;
                        next();
                    }
                })
        })

    }

};

exports.saveWidgets = function (req, res, next) {
    if (req.user) {
        req.dashboardId = req.body.dashboardId;
        userPermission.checkUserAccess(req, res, function (err, response) {
            console.log('utility response', response)
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else {
                var createWidget = new widgetsList();

                //To store the widget
                //To check whether new dashboard or not
                if (req.body.widgetId === undefined) {
                    createWidget.dashboardId = req.body.dashboardId;
                    createWidget.widgetType = req.body.widgetType;
                    createWidget.name = req.body.name;
                    createWidget.description = req.body.description;
                    createWidget.charts = req.body.charts;
                    createWidget.referenceWidgetId = req.body.referenceWidgetId;
                    createWidget.order = req.body.order;
                    createWidget.offset = req.body.offset;
                    createWidget.size = req.body.size;
                    createWidget.minSize = req.body.minSize;
                    createWidget.maxSize = req.body.maxSize;
                    createWidget.created = new Date();
                    createWidget.updated = new Date();
                    console.log('created', createWidget.created);

                    createWidget.save(function (err, widgetDetail) {
                        console.log('widget details',widgetDetail)
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!widgetDetail)
                            return res.status(501).json({error: 'Not implemented'})
                        else {
                            req.app.result = widgetDetail;
                            next();
                        }
                    });
                }

                //To update already existing database
                else {

                    // set all of the user data that we need
                    var name = req.body.name == undefined ? '' : req.body.name;
                    var description = req.body.description == undefined ? '' : req.body.description;
                    var widgetId = req.body.widgetId;
                    var widgetType = req.body.widgetType == undefined ? '' : req.body.widgetType;
                    var metrics = req.body.metrics == undefined ? '' : req.body.metrics;
                    var order = req.body.order == undefined ? '' : req.body.order;
                    var offset = req.body.offset == undefined ? '' : req.body.offset;
                    var size = req.body.metrics == undefined ? '' : req.body.size;
                    var minSize = req.body.metrics == undefined ? '' : req.body.minSize;
                    var maxSize = req.body.metrics == undefined ? '' : req.body.maxSize;
                    var chartType = req.body.chartType == undefined ? '' : req.body.chartType;
                    var updated = new Date();


                    // update the dashboard data
                    widgetsList.update({_id: widgetId}, {
                        $set: {
                            name: name,
                            description: description,
                            widgetType: widgetType,
                            order: order,
                            metrics: metrics,
                            offset: offset,
                            size: size,
                            minSize: minSize,
                            maxSize: maxSize,
                            chartType: chartType,
                            updated: updated
                        }
                    }, {upsert: true}, function (err, widget) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (widget === 0)
                            return res.status(501).json({error: 'Not implemented'});
                        else {
                            widgetsList.findOne({_id: widgetId}, function (err, widgetDetails) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (widgetDetails)
                                    return res.status(204).json({error: 'No records found'});
                                else {
                                    req.app.result = widgetId;
                                    next();
                                }
                            })
                        }
                    });
                }
            }
        })

    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})


};

exports.saveCustomWidgets = function (req, res, next) {
    console.log('response');
    var createCustomWidget = new widgetsList();

    createCustomWidget.dashboardId = req.body.dashboardId;
    createCustomWidget.widgetType = req.body.widgetType;
    createCustomWidget.channelId = req.body.channelId;
    createCustomWidget.created = new Date();
    createCustomWidget.updated = new Date();
    createCustomWidget.save(function (err, customWidgetDetail) {
        if (!err)
            req.app.result = {'status': '200', 'id': customWidgetDetail};
        else
            req.app.result = {'status': '302'};
        next();
    });

};
