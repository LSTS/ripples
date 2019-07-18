import { createAction } from 'redux-starter-kit'

export const setUser = createAction('SET_USER')
export const removeUser = createAction('REMOVE_USER')
export const setVehicles = createAction('SET_VEHICLES')
export const setSpots = createAction('SET_SPOTS')
export const setAis = createAction('SET_AIS')
export const setCcus = createAction('SET_CCUS')
export const setPlans = createAction('SET_PLANS')
export const deleteWp = createAction('DELETE_WP')
export const updateWpLocation = createAction('UPDATE_WP_LOCATION')
export const updateWpTimestamp = createAction('UPDATE_WP_TIMESTAMP')
export const updatePlanId = createAction('UPDATE_PLAN_ID')
export const addWpToPlan = createAction('ADD_WP_TO_PLAN')
export const editPlan = createAction('EDIT_PLAN')
export const cancelEditPlan = createAction('CANCEL_EDIT_PLAN')
export const addNewPlan = createAction('ADD_NEW_PLAN')
export const savePlan = createAction('SAVE_PLAN')
export const setProfiles = createAction('SET_PROFILES')
export const setSlider = createAction('SET_SLIDER')
export const setSelectedWaypointIdx = createAction('SET_SELECTED_WAYPOINT')
export const setToolSelected = createAction('SET_TOOL_SELECTED')
export const selectVehicle = createAction('SELECT_VEHICLE')
export const setPlanDescription = createAction('SET_PLAN_DESCRIPTION')
export const setSidePanelTitle = createAction('SET_SIDE_PANEL_TITLE')
export const setSidePanelContent = createAction('SET_SIDE_PANEL_CONTENT')
export const setSidePanelVisibility = createAction('SET_SIDE_PANEL_VISIBILITY')
export const togglePlanVisibility = createAction('TOGGLE_PLAN_VISIBILITY')
export const unschedulePlan = createAction('UNSCHEDULE_PLAN')
export const updateVehicle = createAction('UPDATE_VEHICLE')
export const updatePlan = createAction('UPDATE_PLAN')
export const updateSpot = createAction('UPDATE_SPOT')
export const updateCCU = createAction('UPDATE_CCU')
