import { createAction } from "@reduxjs/toolkit";
import { not } from "ramda";
import { delay, fork, put, select, take } from "redux-saga/effects";
import {
  clear,
  collapse,
  createRandomBoard,
  fill,
  isAdjacent,
  isStable,
  swap,
} from "./board";
import { matchThree } from "./match-three";

export const animationActions = {
  started: createAction("[animation] STARTED"),
  completed: createAction("[animation] COMPLETED"),
};

const { actions, selectors } = matchThree;
const { setBoard, setGrabbed, grab, drop } = actions;
const { board } = selectors;

function* swapFlow() {
  const { payload: index1 } = yield take(grab);

  yield put(setGrabbed(index1));

  const { payload: index2 } = yield take(drop);

  yield put(setGrabbed(undefined));

  if (isAdjacent(index1, index2)) {
    const previous = yield select(board);

    yield put(setBoard(swap(index1, index2, yield select(board))));

    if (isStable(yield select(board))) {
      yield delay(1000 / 2);

      yield put(setBoard(previous));
    }
  }
}

function* cascadeFlow() {
  while (not(isStable(yield select(board)))) {
    yield delay(1000 / 3);

    yield put(setBoard(clear(yield select(board))));

    yield delay(1000 / 3);

    yield put(setBoard(collapse(yield select(board))));

    yield delay(1000 / 3);

    yield put(setBoard(fill(yield select(board))));
  }
}

function* boardFlow() {
  while (true) {
    yield* cascadeFlow();

    yield* swapFlow();
  }
}

export function* boardSaga() {
  const emptyBoard = [[]];

  yield put(setBoard(emptyBoard));

  yield delay(1000);

  const initialBoard = createRandomBoard();

  yield put(setBoard(initialBoard));

  yield fork(boardFlow);
}