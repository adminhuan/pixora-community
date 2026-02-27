import { Card } from '../../../components/ui';

interface SimilarQuestionsProps {
  list: string[];
}

export const SimilarQuestions = ({ list }: SimilarQuestionsProps) => (
  <Card title="相似问题推荐">
    <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
      {list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </Card>
);
