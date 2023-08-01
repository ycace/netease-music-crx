import React, { useEffect, useMemo, useState } from "react";
import { useSnapshot } from "valtio";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { formatScondTime } from "../utils";
import store, * as storeUtils from "./store";

export default function PlayList({ maxHeight }) {
  const snap = useSnapshot(store);
  const [loading, setLoading] = useState(false);
  const [songsMap, setSongsMap] = useState({});
  const { selectedSong, selectedPlaylist, playlists, songsMapChanged } = snap;
  const currentPlaylistId = selectedPlaylist?.id;
  const playlistRefs = createRefs(playlists);
  useEffect(() => {
    storeUtils
      .loadSongsMap()
      .then((songsMap) => setSongsMap(songsMap))
      .finally(() => {
        setLoading(false);
      });
  }, [currentPlaylistId]);
  const [songs, songRefs] = useMemo(() => {
    const songs =
      selectedPlaylist?.normalIndexes
        .map((id) => {
          if (!songsMap[id]) return null;
          if (id === songsMapChanged?.songId) {
            if (songsMapChanged?.op === "invalid") {
              songsMap[id].valid = false;
            } else if (songsMapChanged?.op === "remove") {
              return null;
            }
          }
          return songsMap[id];
        })
        .filter((v) => !!v) || [];
    const songRefs = createRefs(songs);
    return [songs, songRefs];
  }, [selectedPlaylist, songsMap, songsMapChanged]);
  const changePlaylist = (id) => {
    setLoading(true);
    storeUtils.changePlaylist(id).catch((_) => setLoading(false));
  };
  useEffect(() => {
    scrollListItemToView(playlistRefs, selectedPlaylist?.id);
  }, [selectedPlaylist, playlistRefs]);
  useEffect(() => {
    if (loading) return;
    scrollListItemToView(songRefs, selectedSong?.id, {
      behavior: "smooth",
      block: "center",
    });
  }, [selectedSong, songRefs, loading]);
  return (
    <Grid container>
      <Grid item xs={4} sx={{ background: "#f3f0f0" }}>
        <List sx={{ maxHeight, overflowY: "auto", py: 0 }}>
          {playlists.map((playlist, index) => {
            const isNewCat =
              playlists[index - 1] &&
              playlists[index - 1].type !== playlist.type;
            const renderAvatar = () => {
              if (playlist.picUrl) {
                return (
                  <Avatar
                    src={playlist.picUrl}
                    sx={{ width: 24, height: 24 }}
                  />
                );
              } else {
                return (
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      color: "white",
                      background: "#ff8058",
                    }}
                  >
                    <QueueMusicIcon sx={{ fontSize: "15px" }} />
                  </Avatar>
                );
              }
            };
            return (
              <ListItemButton
                key={playlist.id}
                sx={isNewCat ? { borderTop: "1px solid #e0e0e0" } : {}}
                selected={playlist.id === currentPlaylistId}
                ref={playlistRefs[playlist.id]}
                onClick={(_) => changePlaylist(playlist.id)}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  {renderAvatar()}
                </ListItemIcon>
                <ListItemText
                  primary={playlist.name}
                  sx={{
                    ".MuiTypography-root": {
                      maxWidth: 180,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Grid>
      <Grid item xs={8} sx={{ maxHeight, overflowY: "auto" }}>
        {loading && (
          <Box
            sx={{
              display: "flex",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {songs.length > 0 && (
          <Table stickyHeader size="small">
            <TableHead sx={{ height: "48px" }}>
              <TableRow>
                <TableCell>
                  <Box sx={{ paddingLeft: "14px" }}>歌曲</Box>
                </TableCell>
                <TableCell>歌手</TableCell>
                <TableCell align="right" style={{ minWidth: 64 }}>
                  时长
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {songs.map((song) => (
                <TableRow
                  key={song.id}
                  selected={song.id === snap.selectedSong?.id}
                  ref={songRefs[song.id]}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    ...(!song.valid ? { filter: "opacity(0.5)" } : {}),
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      maxWidth: 200,
                      py: "4px",
                      pl: "16px",
                      ...(song.st < 0 ? { filter: "opacity(0.5)" } : {}),
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <IconButton
                        disabled={!song.valid}
                        onClick={() => storeUtils.playSong(song.id)}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                      <Box
                        sx={{
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {song.name}
                      </Box>
                      {song.vip && song.vip && (
                        <Chip
                          sx={{ height: "20px", ml: "4px" }}
                          label="vip"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 200,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {song.artists}
                  </TableCell>
                  <TableCell align="right">
                    {song.duration
                      ? formatScondTime(song.duration / 1000)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Grid>
    </Grid>
  );
}

function createRefs(list) {
  return list.reduce((acc, cur) => {
    acc[cur.id] = React.createRef();
    return acc;
  }, {});
}

function scrollListItemToView(refs, id, opts) {
  if (id && refs[id]) {
    const el = refs[id].current;
    if (!isInViewport(el)) {
      el.scrollIntoView(opts);
    }
  }
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
