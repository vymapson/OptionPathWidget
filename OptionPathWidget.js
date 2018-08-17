OptionPathWidget.prototype = new P1Main();
OptionPathWidget.prototype.constructor = OptionPathWidget;
function OptionPathWidget(options) {
    var settings = $.extend({
        id: '',
        mode: 'new',
        params: null,
        wLocation: '',
        wNumber: '',
        triggeredByChange: false,
        setValueOnComplete: null
    }, options);

    var setupController = new p1.controllers.setup();

    //init elements
    var $opwHandle = $('#' + settings.id);
    var $opwContainer = $('#optionPathWidgetContainer' + settings.wNumber);
    var $opwTree = $('#optionPathWidgetTree' + settings.wNumber);
    var $opwLabel = $('#optionPathWidgetTreeLabel' + settings.wNumber);
    var $opwLabelContainer = $('#optionPathWidgetLabelContainer' + settings.wNumber);
    var $opwOuterDiv = $opwHandle.parent();
    var wId = settings.wLocation + settings.wNumber;

    //init variables
    var initTreeHeight = 25;
    var initContainerHeight = 40;
    var maxContainerWidth = 350; //may tinker with this variable on a wLocation basis
    var nodeHeight = 0;
    var nodeHeightOffset = 1;
    var buffer = 2;
    $opwTree.height(initTreeHeight);
    $opwContainer.height(initContainerHeight);
    var currSel = [];
    var eventObjects = [];
    var treeDef = [];
    var treeNodes = [];
    var firstOpen = true;
    var tooltipExists = false;
    var containerParentCssBorder = '';
    var addOptionHandling = true;

    //init tree defining params
    var treeSettings = new p1.models.genericitem2();
    var paramSet = $.extend({
        siteID: -1,
        includeViews: false
    }, settings.params);

    //determine tree definition
    switch (settings.wLocation) {
        case 'fieldsetup':
            treeDef = ['site', 'area'];
            break;
        case 'datasetup':
            treeDef = ['site', 'area'];
            break;
        case 'kpisetup':
            treeDef = settings.wNumber == '' ? ['site', 'area'] : ['site', 'area', 'datasource'];
            break;
        case 'reportsetup':
            treeDef = ['site', 'area'];
            break;
        case 'usersetup':
            treeDef = ['site', 'area'];
            break;
        case 'viewsetup':
            treeDef = ['site', 'area'];
            break;
        case 'apprimkpi':
            treeDef = ['area', 'kpi'];
            treeSettings.Id = paramSet.siteID;
            addOptionHandling = false;
            break;
    }

    //set text
    $opwHandle.text($('#hfOptionPathWidgetSelect').val());
    $opwHandle.addClass('OptionPathWidgetHandle');
    $opwLabel.text($opwHandle.text());
    $opwLabel.addClass('OptionPathWidgetLabel');
    $opwLabelContainer.addClass('OptionPathWidgetLabelContainer');

    //init tooltip
    var initTooltip = function () {
        if (tooltipExists) {
            $opwHandle.qtip('destroy');
        }
        $opwHandle.qtip({
            content: $opwHandle.text(),
            show: 'mouseover',
            hide: 'mouseout',
            position: {
                corner: {
                    target: 'leftBottom',
                    tooltip: 'leftTop'
                }
            },
            style: {
                width: {
                    min: 200,
                    max: 500
                }
            }
        });
        tooltipExists = true;
    };

    //format dialog
    var formatDialog = function (open) {
        if (open) {
            $($opwContainer.prev()).hide(); //rids the title bar
            $opwTree.find('ul').css({ 'border': 'none' }); //rids dotted border
            $('.ui-widget-overlay').css({ 'background': 'none' }).bind('click', closeDialog); //rids the dark overlay
            $($opwContainer.parent()).addClass('OptionPathWidgetContainer');
            $opwContainer.removeClass('ui-widget-content').removeClass('ui-dialog-content');
            containerParentCssBorder = $($opwContainer.parent()).css('border-color');
            $($opwContainer.parent()).css({'border-color':'#aaaaaa'});
        } else {
            $('.ui-widget-overlay').css({ 'background': '' }).unbind('click', closeDialog); //brings back dark overlay
            $($opwContainer.parent()).removeClass('OptionPathWidgetContainer');
            $opwContainer.addClass('ui-widget-content').addClass('ui-dialog-content');
            $($opwContainer.parent()).css({ 'border-color': containerParentCssBorder });
        }
    };

    //get key value by tree level selector
    var getOptionBySelector = function (treeNode, selector) {
        var result = { Id: '', Name: '' };
        var match = false;
        if (treeNode.data.key && treeNode.data.title) {
            var nodeData = treeNode.data.key.split("_");
            if (nodeData.length == 2) {
                if (nodeData[0] == selector) {
                    result.Id = nodeData[1];
                    result.Name = treeNode.data.title;
                    match = true;
                }
            }
        }
        if (match) {
            return result;
        } else {
            if (treeNode.parent != null) {
                return getOptionBySelector(treeNode.parent, selector);
            } else {
                console.log(settings.wLocation + ' - Option Path Widget - cannot get option by selector');
                return result;
            }
        }
    };

    //get tree option string
    var getOptionString = function (obtain, treeNode, outStr) {
        var nodeStr = (obtain == 'title') ? treeNode.data.title : treeNode.data.key;
        if (nodeStr != undefined) {
            if (nodeStr != "") {
                outStr = nodeStr + '/' + outStr;
            }
        }
        if (treeNode.parent != null) {
            return getOptionString(obtain, treeNode.parent, outStr);
        } else {
            if (outStr != "") {
                outStr = outStr.substring(0, outStr.length - 1);
            }
            if (settings.triggeredByChange) {
                outStr = outStr.substring(outStr.indexOf('/') + 1);
            }
            return outStr;
        }
    };

    //vary height
    var changeHeight = function (add, amount) {
        if (add) {
            $opwContainer.height($opwContainer.height() + amount);
            $opwTree.height($opwTree.height() + amount);
        } else {
            $opwContainer.height($opwContainer.height() - amount);
            $opwTree.height($opwTree.height() - amount);
        }
        //$opwTree.find('.dynatree-container').height($opwTree.height());
        $opwTree.find('.dynatree-container').css({ 'height': 'auto' });
    };

    //vary width
    var changeWidth = function () {
        var rPosLabel = $opwLabel.position().left + $opwLabel.width();
        var rPosNodeMax = getTreeNodeMaxRPos($opwTree.dynatree('getRoot'));
        var iWidth = Math.max(rPosLabel, rPosNodeMax);
        setWidth(iWidth);
    };

    var setWidth = function(iWidth) {
        var oWidth = iWidth + buffer;
        (oWidth > maxContainerWidth) ? $opwContainer.width(maxContainerWidth) : $opwContainer.width(oWidth);
        (oWidth > maxContainerWidth) ? $($opwContainer.parent()).width(maxContainerWidth) : $($opwContainer.parent()).width(oWidth);
        (oWidth > maxContainerWidth) ? $opwLabelContainer.width(maxContainerWidth - buffer) : $opwLabelContainer.width(iWidth);
        (oWidth > maxContainerWidth) ? $opwTree.width(maxContainerWidth - buffer) : $opwTree.width(iWidth);
        (oWidth > maxContainerWidth) ? $opwTree.find('.dynatree-container').width(maxContainerWidth - buffer) : $opwTree.find('.dynatree-container').width(iWidth);
    };

    //get max right position
    var getTreeNodeMaxRPos = function (node) {
        var rPosNode = 0;
        var rPosChildNode = 0;
        var rPosChildNodeMax = 0;
        var rPosChildNodes = [];
        if (node) {
            if (node.span) {
                rPosNode = $(node.span).position().left + $(node.span).width();
            }
            if (node.childList) {
                for (var n = 0; n < node.childList.length; n++) {
                    rPosChildNode = getTreeNodeMaxRPos(node.childList[n]);
                    rPosChildNodes.push(rPosChildNode);
                }
                rPosChildNodeMax = Math.max.apply(Math, rPosChildNodes);
            }
        }
        return Math.max(rPosNode, rPosChildNodeMax);
    };

    var getLevelChanges = function () {
        var result = [];
        var tnodes = $opwTree.dynatree('getSelectedNodes');
        if (tnodes.length == 1) {
            var nextSelVars = getOptionString('key', tnodes[0], '').split('/');
            nextSelVars.splice(0, 1); //after this step, nextSelVars should be the same length as TreeDef
            for (var p = 0; p < nextSelVars.length; p++) {
                var nextSelId = nextSelVars[p].split('_')[1];
                if (treeDef.length > 0) {
                    if (nextSelId != currSel[p]) {
                        result.push(nextSelVars[p].split('_')[0]);
                    }
                }
                currSel[p] = nextSelId;
            }
        }
        return result; //an array of strings representing which changes occured
    };

    //close widget
    var closeDialog = function () {
        $opwContainer.dialog('close');
    };

    var getNodeByKey = function (nodeKey) {
        var nodeFound = false;
        var outNode;
        $opwTree.dynatree('getRoot').visit(function (dtnode) {
            if (dtnode.data.key == nodeKey) {
                nodeFound = true;
                outNode = dtnode;
            }
        });
        if (nodeFound) {
            return outNode;
        } else {
            return false;
        }
    };

    var setTreeNodes = function(inputNodes) {
        var rootNode = $opwTree.dynatree('getRoot');
        rootNode.removeChildren();
        if (inputNodes) {
            if (inputNodes.length > 0) {
                if (rootNode && rootNode.addChild) rootNode.addChild(inputNodes);
            }
        }
    };

    var hasTree = function () {
        if ($opwTree.children().children()) {
            return ($opwTree.children().children().length > 0);
        } else {
            return false;
        }
    };

    var addOptionPath = function (nodeData, count) {
        var parentNode = getNodeByKey(treeDef[treeDef.length - 2 - count] + '_' + nodeData[count].dataId);
        if (parentNode) {
            parentNode.addChild(nodeData[count]);
            parentNode.sortChildren();
        } else {
            //To Do --> enable option path adding for more than one level
            //var newParentNode = nodeData[count + 1];
            //newParentNode.children = [];
        }
    };

    var selectionMade = function () {
        return !($opwHandle.text() == $('#hfOptionPathWidgetSelect').val());
    };

    var setOption = function(elemId) {
        if (elemId) {
            if (treeDef.length > 0) {
                var treeSelector = treeDef[treeDef.length - 1];
                var key = treeSelector + "_" + elemId.toString();
                var nodeToSelect = getNodeByKey(key);
                if (nodeToSelect) {
                    nodeToSelect.data.AddClass = 'fromSet';
                    $opwTree.dynatree("getTree").selectKey(key);
                } else {
                    if (addOptionHandling) {
                        setupController.getOptionPathWidgetNodeParentList(elemId, treeDef, function (nodeData) {
                            if (nodeData) {
                                if (nodeData != "") {
                                    addOptionPath(nodeData, 0);
                                    nodeToSelect = getNodeByKey(key);
                                    if (nodeToSelect) {
                                        nodeToSelect.data.AddClass = 'fromSet';
                                        $opwTree.dynatree("getTree").selectKey(key);
                                    }
                                }
                            }
                        });
                    }
                }
            } else {
                console.log(settings.wLocation + ' - Option Path Widget - no tree definition');
            }
        }
    };

    var OnLoad = function () {

        //init dynatree
        $opwTree.dynatree({
            checkbox: true,
            selectMode: 1,
            imagePath: "images/",
            onExpand: function (flag, node) {
                if (node && node.childList) {
                    var heightDiff = (nodeHeight + nodeHeightOffset) * node.childList.length;
                    changeHeight(flag, heightDiff);
                    changeWidth();
                }
            },
            onSelect: function (flag, node) {
                var fromSet = (node.data.AddClass == 'fromSet');
                var doChange = !(fromSet && selectionMade());
                if (fromSet) node.data.AddClass = '';
                var selNodes = $opwTree.dynatree('getSelectedNodes');
                if (selNodes.length == 1) {
                    $opwHandle.text(getOptionString('title', selNodes[0], ''));
                    $opwLabel.text($opwHandle.text());
                    //initTooltip();
                }
                if (doChange) {
                    var eventArray = getLevelChanges();
                    for (var e = 0; e < eventArray.length; e++) {
                        var eventObjsOfType = eventObjects.filter(function (et) { return (et.eType == eventArray[e]); });
                        for (var ob = 0; ob < eventObjsOfType.length; ob++) {
                            var funcToCall = eventObjsOfType[ob].eFunc;
                            if (typeof (funcToCall == 'function')) funcToCall();
                        }
                    }
                }
                if ($opwOuterDiv.hasClass('ui-bgMissingInfo')) $opwOuterDiv.removeClass('ui-bgMissingInfo');
                if ($($opwContainer.parent()).hasClass('OptionPathWidgetContainer')) $opwContainer.dialog('close');
            }
        });
        $opwTree.css('overflow', 'hidden').find('.dynatree-container').height($opwTree.height());

        //init dialog
        $opwHandle.unbind('click').on('click', function () {
            if (hasTree()) {
                $opwContainer.dialog({
                    resizable: false,
                    modal: true,
                    width: maxContainerWidth,
                    minHeight: initContainerHeight,
                    zIndex: 1000000000,
                    open: function () {
                        formatDialog(true);
                        if (firstOpen) {
                            nodeHeight = $($($opwContainer.find('.dynatree-container')).find('a, .dynatree-title')[0]).height();
                            if (treeNodes) {
                                if (treeNodes.length == 1) {
                                    var node = getNodeByKey(treeNodes[0].key);
                                    if (node && node.childList) {
                                        changeHeight(true, (nodeHeight + nodeHeightOffset) * (node.childList.length));
                                        if (node.childList.length == 1 && settings.triggeredByChange) {
                                            var node2 = getNodeByKey(node.childList[0].key);
                                            if (node2 && node2.childList) {
                                                changeHeight(true, (nodeHeight + nodeHeightOffset) * (node2.childList.length));
                                            }
                                        }
                                    }
                                } else if (treeNodes.length > 0) {
                                    changeHeight(true, (nodeHeight + nodeHeightOffset) * (treeNodes.length - 1));
                                }
                            }
                            setWidth(maxContainerWidth - buffer); //sets width to max, so that changeWidth() can find the right most position (if below max)
                            firstOpen = false;
                        }
                        changeWidth();
                    },
                    beforeClose: function () {
                        formatDialog(false);
                    },
                    position: { my: 'left top', at: 'left top', of: '#' + settings.id }
                });
            } else {
                if (settings.triggeredByChange) {
                    switch (wId) {
                        case 'kpisetup2':
                            alert('please select site/area'); //text resources
                            break;
                    }
                } else {
                    switch (wId) {
                        case 'apprimkpi':
                            alert($('#hfNoPrimKpis').val());
                            break;
                        default:
                            alert('no options'); //text resources
                            break;
                    }
                }
            }
        });

        //populate tree
        if (wId != undefined && !settings.triggeredByChange) {
            setupController.getOptionPathWidget(wId, treeDef, treeSettings, function (data) {
                if (data) {
                    treeNodes = data.TreeNodes;
                    setTreeNodes(treeNodes);
                    if (settings.setValueOnComplete != null) {
                        setOption(settings.setValueOnComplete);
                    }
                }
            });
        }

    } ();

    this.Clear = function () { //may have to make option to clear tree
        $opwHandle.text($('#hfOptionPathWidgetSelect').val());
        $opwLabel.text($opwHandle.text());
        var rootNode = $opwTree.dynatree("getRoot");
        if (rootNode) {
            rootNode.visit(function (dtnode) {
                dtnode.select(false);
                if (!firstOpen) dtnode.expand(false);
            });
            if (!firstOpen) {
                if (rootNode.childList) {
                    if (rootNode.childList.length == 1) {
                        rootNode.childList[0].expand(true);
                    }
                }
            }
            $opwTree.height(initTreeHeight);
            $opwContainer.height(initContainerHeight);
            firstOpen = true;
            tooltipExists = false;
            if (settings.triggeredByChange) {
                rootNode.removeChildren();
                treeNodes = [];
            }
            currSel = [];
        }
    };

    this.Get = function (treeSelector) {
        var result = { Id: '', Name: '' };
        var selNodes = $opwTree.dynatree('getSelectedNodes');
        if (selNodes.length = 1) {
            if (selNodes[0] != undefined) {
                result = getOptionBySelector(selNodes[0], treeSelector);
            }
        } else if (selNodes.length = 0) {
            console.log(settings.wLocation + ' - Option Path Widget - no selection');
        } else {
            console.log(settings.wLocation + ' - Option Path Widget - multiple selection error');
        }
        return result;
    };

    this.Set = function (elemId) {
        setOption(elemId);
    };

    this.AddHighlight = function () {
        $opwOuterDiv.addClass('ui-bgMissingInfo');
    };

    this.RemoveHighlight = function () {
        $opwOuterDiv.removeClass('ui-bgMissingInfo');
    };

    this.Enable = function () {
        $opwHandle.attr('disabled', false);
        $opwContainer.attr('disabled', false);
    };

    this.Disable = function () {
        $opwHandle.attr('disabled', true);
        $opwContainer.attr('disabled', true);
    };

    this.Change = function (treeSelector, inputFunc) {
        var eObj = { eType: treeSelector, eFunc: inputFunc };
        eventObjects.push(eObj);
    };

    this.ExecChange = function(treeSelector) {
        var eventObjsOfType = eventObjects.filter(function (et) { return (et.eType == treeSelector); });
        for (var ob = 0; ob < eventObjsOfType.length; ob++) {
            var funcToCall = eventObjsOfType[ob].eFunc;
            if (typeof (funcToCall == 'function')) funcToCall();
        }
    };

    this.GetTree = function (params, cback) {
        var paramSetLoc = $.extend({
            siteID: -1,
            includeViews: false
        }, params);

        //populate tree
        if (wId != undefined) {
            var treeSettingsLoc = new p1.models.genericitem2();
            switch (wId) {
                case 'apprimkpi':
                    treeSettingsLoc.Id = paramSetLoc.siteID;
                case 'kpisetup2':
                    treeSettingsLoc.Id = paramSetLoc.siteID;
                    treeSettingsLoc.Active = paramSetLoc.includeViews;
                    break;
            }
            setupController.getOptionPathWidget(wId, treeDef, treeSettingsLoc, function (data) {
                if (data) {
                    treeNodes = data.TreeNodes;
                    setTreeNodes(treeNodes);
                }
                if (typeof (cback) == 'function') {
                    cback();
                }
            });
        }
    };

    this.IsSelected = function () {
        return selectionMade();
    };
}