// Each source owns casting and collection naming. Sorting/pagination execute in MongoDB,
// so later pages do not transfer all previous pages to the application process.
export const unionPage = async (sources, { page = 1, limit = 20, sort }) => {
  const [result] = await sources[0].repository.aggregate([
    ...sourcePipeline(sources[0]),
    ...sources.slice(1).map((source) => ({
      $unionWith: { coll: source.repository.collectionName, pipeline: sourcePipeline(source) },
    })),
    {
      $facet: {
        data: [
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $unset: ["_sortTitle", "_sortViews"] },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const total = result?.total?.[0]?.count ?? 0;
  return {
    data: result?.data ?? [],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
const sourcePipeline = ({ repository, filter, projection, type }) => [
  { $match: repository.castFilter(filter) },
  { $project: projection },
  {
    $set: {
      type: { $literal: type },
      _sortTitle: { $ifNull: ["$title", "$name"] },
      _sortViews: { $ifNull: ["$viewCount", 0] },
    },
  },
];
