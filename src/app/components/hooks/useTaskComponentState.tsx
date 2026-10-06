import { useEffect, useState } from "react";
import useFilterTasks from "./useFilterTasks";
import { useScope } from "@/app/context/ScopeContext";

export function useTaskComponentState() {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [refreshFlagTags, setRefreshFlagTags] = useState(false);

  const [toggleModalMenu, setToggleModalMenu] = useState(false);
  const [toggleModalCalendar, setToggleModalCalendar] = useState(false);
   const [toggleModalGroups, setToggleModalGroups] = useState(false);
  const [toggleModalTag, setToggleModalTag] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTask, setSelectedTask] = useState<object | null>(null);
  const [selectedTag, setSelectedTag] = useState<object | null>(null);

  const [filter, setFilter] = useState("Today");
  const [filterImage, setFilterImage] = useState("");

  const [editListItem, setEditListItem] = useState<object | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagId, setTagId] = useState(null);

  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  const [nameCategory, setNameCategory] = useState<string | undefined>("");
  const [modeModal, setModeModal] = useState<string | undefined>();
  const [modeModalTag, setModeModalTag] = useState<string | undefined>();

  const { groupId } = useScope();

  const isCategory = categoryId !== null;
  const isTag = tagId !== null;

  const { tasks, refresh } = useFilterTasks(
    filter,
    isCategory,
    categoryId,
    isTag,
    tagId
  );

  const triggerRender = () => {
    console.log("renderovano");
    setRefreshFlag(prev => !prev);
  };

  const triggerRenderTags = () => {
    setRefreshFlagTags(prev => !prev);
  };
  
  useEffect(() => {
    setSelectedTask(null);
  }, [filter, categoryId, tagId, groupId]);
 useEffect(() => {
    console.log(toggleModalGroups);
  }, [toggleModalGroups]);
  const taskMenuProps = {
    setFilter,
    tagId,
    setTagId,
    setSelectedTag,
    setModeTag: setModeModalTag,
    refreshFlagTags,
    setToggleModalTag,
    ToggleModalTag: toggleModalTag,
    Mode: modeModal,
    setNameCategory,
    onUpdate:triggerRender,
    onUpdateTag:triggerRenderTags,
    setMode: setModeModal,
    setEditListItem,
    SideMenuVisible: sideMenuVisible,
    refreshFlag,
    setSelectedTask,
    setFilterImage,
    setCategoryId,
    categoryId,
    setToggleModal: setToggleModalMenu,
    setTaskFilter: setFilter,
    ToggleModal: toggleModalMenu,
  };

  const taskDisplayProps = {
    tagId,
    refreshFlag,
    SideMenuVisible: sideMenuVisible,
    setSideMenuVisible,
    selectedTaskProp: selectedTask,
    setSelectedTaskProp: setSelectedTask,
    categoryId,
    filterImage,
    filter,
    refreshTasks: refresh,
    tasksArray: tasks,
    fullDate: selectedDate,
    setFullDate: setSelectedDate,
    ToggleModal: toggleModalCalendar,
    setToggleModal: setToggleModalCalendar,
  };

  const listModalProps = {
    setTaskFilter: setFilter,
    setFilterImage,
    nameCategory,
    setnameCategory: setNameCategory,
    Mode: modeModal,
    setEditListItem,
    editListItem,
    onUpdate: triggerRender,
    isActive: toggleModalMenu,
    setActive: setToggleModalMenu,
  };
const groupModalProps = {
    setTaskFilter: setFilter,
    setFilterImage,
    nameCategory,
    setnameCategory: setNameCategory,
    Mode: modeModal,
    setEditListItem,
    editListItem,
    onUpdate: triggerRender,
    isActive: toggleModalGroups,
    setActive: setToggleModalGroups,
  };
  const calendarModalProps = {
    setDate: setSelectedDate,
    DateInherited: selectedDate,
    isActive: toggleModalCalendar,
    setActive: setToggleModalCalendar,
  };

  const tagModalProps = {
    setSelectedTag,
    selectedTag,
    Mode: modeModalTag,
    onUpdate: triggerRenderTags,
    isActive: toggleModalTag,
    setActive: setToggleModalTag,
  };

  return {
    taskMenuProps,
    taskDisplayProps,
    listModalProps,
    calendarModalProps,
    tagModalProps,
    groupModalProps
  };
}