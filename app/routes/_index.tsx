import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useLoaderData } from "@remix-run/react";
import { PromisePool } from "@supercharge/promise-pool";
import { RadioGroup } from "@headlessui/react";
import { json } from "@vercel/remix";
import { orderBy, snakeCase } from "lodash-es";
import { useCallback, useMemo } from "react";
import createPersistedState from "use-persisted-state";

import { classNames } from "../utils";
import { getMovie } from "../tmdb";

import type { Movie, MovieData } from "../types";

export async function loader() {
  const data: MovieData[] = await import("../movies.json");

  const { results } = await PromisePool.for(data)
    .withConcurrency(5)
    .withTaskTimeout(1500)
    .process(async (movie) => {
      const { poster_path } = await getMovie(movie);

      return {
        ...movie,
        poster: `http://image.tmdb.org/t/p/original${poster_path}`,
      };
    });

  return json(
    {
      movies: orderBy(results, ["title"]),
    },
    {
      headers: {
        "Cache-Control": "max-age=2592000, must-revalidate",
      },
    }
  );
}

type FilterBy = "watched" | "unwatched" | "all";

const getId = (movie: Movie) => snakeCase(movie.title) + "_" + movie.year;
const useFilterByState = createPersistedState<FilterBy>("filterBy");
const useFilterBy = () => {
  const [filterState, setFilterState] = useFilterByState();
  return [filterState ? filterState : "unwatched", setFilterState] as const;
};
const useMoviesState = createPersistedState<string[]>("watchedMovies");
const useMovies = (movies: Movie[], { filterBy }: { filterBy: FilterBy }) => {
  const [state, setState] = useMoviesState();
  const _movies = useMemo(() => {
    return movies.filter((movie) => {
      switch (filterBy) {
        case "watched":
          return state?.includes(getId(movie));
        case "unwatched":
          return !state?.includes(getId(movie));
        default:
          return true;
      }
    });
  }, [filterBy, movies, state]);

  const toggle = useCallback(
    (movie: Movie) => {
      const id = getId(movie);

      setState((prev) => {
        if (prev?.includes(id)) {
          return prev.filter((movieId) => {
            return movieId !== id;
          });
        }

        return prev ? [...prev, id] : [id];
      });
    },
    [setState]
  );

  const reset = useCallback(() => {
    setState(undefined);
  }, [setState]);

  const isWatched = useCallback(
    (movie: Movie) => {
      return state?.includes(getId(movie));
    },
    [state]
  );

  return {
    toggle,
    reset,
    movies: _movies,
    isWatched,
  };
};

const filterOptions = [
  { label: "Unwatched", value: "unwatched" },
  { label: "Watched", value: "watched" },
  { label: "All", value: "all" },
];

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [filterBy, setFilterBy] = useFilterBy();
  const { movies, toggle, isWatched, reset } = useMovies(data.movies, {
    filterBy,
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between pb-2 pt-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Christmas Watchlist
        </h1>
        <div>
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure?")) {
                reset();
              }
            }}
            className="inline-flex items-center gap-x-1.5 rounded bg-white dark:text-white p-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-0 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>
      <div>
        <RadioGroup value={filterBy} onChange={setFilterBy} className="mt-2">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {filterOptions.map((option, idx) => (
              <RadioGroup.Option
                key={idx}
                value={option.value}
                className={({ active, checked }) =>
                  classNames(
                    "cursor-pointer focus:outline-none",
                    active ? "ring-2 ring-indigo-600 ring-offset-2" : "",
                    checked
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "ring-1 ring-inset ring-gray-300 bg-white dark:hover:bg-slate-700 dark:ring-0 dark:ring-gray-700 dark:text-white dark:bg-slate-800 text-gray-900 hover:bg-gray-50",
                    "flex items-center justify-center rounded-md py-3 px-3 text-sm font-semibold uppercase sm:flex-1"
                  )
                }
              >
                <RadioGroup.Label as="span">{option.label}</RadioGroup.Label>
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
      <section className="my-8">
        <ol className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie, idx) => (
            <li key={idx} className="col-span-1 flex flex-col">
              <div>
                <div className="w-full relative aspect-[2/3] rounded-lg bg-white dark:bg-gray-400 shadow-lg mb-2 overflow-hidden">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      loading="lazy"
                      width={240}
                      className="w-full h-full object-cover rounded-lg z-0"
                      alt={movie.title}
                    />
                  ) : null}
                  <div className="absolute hidden md:flex group motion-reduce:transition-none motion-reduce:opacity-100 transition-opacity ease-in-out opacity-0 duration-300 hover:opacity-100 hover:bg-black/50 top-0 left-0 z-10 w-full h-full items-center justify-center">
                    <button
                      onClick={toggle.bind(null, movie)}
                      type="button"
                      className={classNames(
                        isWatched(movie)
                          ? "dark:hover:bg-indigo-700 dark:bg-indigo-800"
                          : "dark:hover:bg-slate-700 dark:bg-slate-800",
                        "hidden md:group-hover:inline-flex items-center gap-x-1.5 rounded bg-white dark:text-white p-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-0 hover:bg-gray-50"
                      )}
                    >
                      Watched
                      <CheckCircleIcon
                        className="-mr-0.5 h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <div>
                    <h2 className="text-lg md:text-base font-medium text-gray-900 dark:text-gray-100">
                      {movie.title}{" "}
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {movie.year}
                      </span>
                    </h2>
                    <h3 className="pointer-events-none block text-sm font-medium text-gray-500 dark:text-gray-400">
                      {movie.rating ? movie.rating + " " : null}
                      <span className="text-gray-500 dark:text-gray-400">
                        {movie.stars}/10
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={toggle.bind(null, movie)}
                    type="button"
                    className="inline-flex md:hidden items-center gap-x-1.5 rounded bg-white dark:hover:bg-white/20 dark:text-white dark:bg-white/10 p-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-0 hover:bg-gray-50"
                  >
                    Watched
                    <CheckCircleIcon
                      className="-mr-0.5 h-5 w-5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
