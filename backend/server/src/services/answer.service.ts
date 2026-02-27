import { questionService } from './question.service';

export const answerService = {
  findById: questionService.getAnswerById.bind(questionService),
  updateAnswer: questionService.updateAnswer.bind(questionService),
  deleteAnswer: questionService.deleteAnswer.bind(questionService),
  voteAnswer: questionService.voteAnswer.bind(questionService),
  acceptAnswer: questionService.acceptAnswer.bind(questionService)
};
